# Disponibilidad recurrente — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un doctor publique su jornada completa (días, franjas, duración, rango de fechas) en una sola operación, y que pueda liberar un rango igual de rápido.

**Architecture:** El patrón no se guarda: se expande a filas de `doctor_schedule` en el backend, dentro de una transacción. La lógica de expansión y de colisiones vive en funciones puras sin base de datos, separada del CRUD. Los dos endpoints aceptan `dry_run` para alimentar una vista previa antes de escribir.

**Tech Stack:** FastAPI · SQLAlchemy async · Alembic · Pydantic v2 · pytest — Next.js 15 · React · TypeScript · Tailwind · shadcn/ui

## Global Constraints

- Días de la semana: `0 = lunes … 6 = domingo`. Coincide con `date.weekday()` de Python y con la grilla del calendario actual.
- `slot_minutes` permitido: `{15, 20, 30, 45, 60}`.
- Rango máximo por petición: **180 días**.
- Tope de turnos por petición: **2000**. Su error debe decir cuántos turnos saldrían y sugerir acortar el rango; nunca un mensaje genérico.
- Un turno con cita activa (estado fuera de `CANCELED_BY_PATIENT` / `CANCELED_BY_DOCTOR`) **nunca** se borra.
- Las colisiones se omiten y se informan; no abortan la operación.
- Comentarios y textos de usuario en español, como el resto del proyecto.
- Backend: `docker exec web python -m pytest`. Frontend: `npx tsc --noEmit`, `npx next lint`, `node --experimental-strip-types --test scripts/*.test.mjs`.

---

### Task 1: Índice único parcial (arregla el 500 al recrear un turno borrado)

**Files:**
- Create: `FesamedCare-Backend-v2/src/migrations/versions/<rev>_partial_unique_schedule.py`
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/users/doctors/doctor_schedule/models.py:41-43`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/users/doctors/test_schedule_unique_index.py`

**Interfaces:**
- Consumes: nada.
- Produces: la tabla `doctor_schedule` acepta recrear un turno idéntico a uno con `deleted_at` no nulo. Todas las tareas siguientes dependen de esto.

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/unit/api/v1/users/doctors/test_schedule_unique_index.py
"""
El borrado de horarios es lógico (deleted_at), pero la restricción única
original no lo contemplaba: borrar un turno y recrearlo idéntico daba 500.
"""
import datetime
import uuid

import pytest
from sqlalchemy import inspect, text

from src.app.core.db.database import async_engine


@pytest.mark.asyncio
async def test_el_indice_unico_ignora_los_borrados():
    async with async_engine.connect() as conn:
        filas = await conn.execute(text("""
            SELECT indexdef FROM pg_indexes
            WHERE tablename = 'doctor_schedule'
              AND indexname = 'doctor_unique_schedule'
        """))
        definicion = filas.scalar_one()

    assert "deleted_at IS NULL" in definicion, (
        "el índice debe ser parcial; si no, un turno borrado sigue ocupando la llave"
    )
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_schedule_unique_index.py -v`
Expected: FAIL — la definición actual no contiene `deleted_at IS NULL`.

- [ ] **Step 3: Escribir la migración**

```python
"""indice unico parcial en doctor_schedule

La restricción original no incluía deleted_at, así que un turno borrado
lógicamente seguía ocupando la llave y recrearlo idéntico daba
UniqueViolationError.
"""
from alembic import op

revision = "<rev>"
down_revision = "<rev anterior>"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("doctor_unique_schedule", "doctor_schedule", type_="unique")
    op.create_index(
        "doctor_unique_schedule",
        "doctor_schedule",
        ["doctor_id", "date_of_service", "start_time", "end_time"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    # Puede fallar si para entonces existen duplicados con deleted_at:
    # la restricción de vuelta es más estricta que el índice parcial.
    op.drop_index("doctor_unique_schedule", table_name="doctor_schedule")
    op.create_unique_constraint(
        "doctor_unique_schedule",
        "doctor_schedule",
        ["doctor_id", "date_of_service", "start_time", "end_time"],
    )
```

Recordar `import sqlalchemy as sa` en la cabecera.

- [ ] **Step 4: Reflejarlo en el modelo**

En `models.py`, reemplazar el bloque `__table_args__`:

```python
    __table_args__ = (
        # Índice parcial, no UniqueConstraint: el borrado es lógico y un turno
        # con deleted_at no debe seguir ocupando la llave. Ver migración
        # <rev>_partial_unique_schedule.
        Index(
            'doctor_unique_schedule',
            'doctor_id', 'date_of_service', 'start_time', 'end_time',
            unique=True,
            postgresql_where=text('deleted_at IS NULL'),
        ),
    )
```

Cambiar el import: `UniqueConstraint` sale, `Index` entra.

- [ ] **Step 5: Aplicar la migración y correr el test**

Run: `docker exec web alembic upgrade head && docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_schedule_unique_index.py -v`
Expected: PASS

- [ ] **Step 6: Correr la suite completa**

Run: `docker exec web python -m pytest -q`
Expected: todo verde.

- [ ] **Step 7: Commit**

```bash
git add src/migrations/versions src/app/api/v1/users/doctors/doctor_schedule/models.py tests/
git commit -m "fix(horarios): indice unico parcial para que borrar y recrear no falle"
```

---

### Task 2: Expansión del patrón a turnos (función pura)

**Files:**
- Create: `FesamedCare-Backend-v2/src/app/api/v1/users/doctors/doctor_schedule/generator.py`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/users/doctors/test_schedule_generator.py`

**Interfaces:**
- Consumes: nada. Sin base de datos, sin FastAPI.
- Produces:
  - `TimeBlock(start: time, end: time)` — dataclass congelada.
  - `SlotCandidate(date_of_service: date, start_time: time, end_time: time)` — dataclass congelada.
  - `expand_pattern(weekdays: set[int], blocks: Sequence[TimeBlock], slot_minutes: int, date_from: date, date_to: date) -> list[SlotCandidate]`
  - `split_by_overlap(candidates: Sequence[SlotCandidate], existing: Mapping[date, Sequence[tuple[time, time]]]) -> tuple[list[SlotCandidate], list[SlotCandidate]]` — devuelve `(aceptados, omitidos)`.
  - `leftover_minutes(blocks: Sequence[TimeBlock], slot_minutes: int) -> int` — minutos que sobran sumando todas las franjas.

- [ ] **Step 1: Escribir los tests que fallan**

```python
# tests/unit/api/v1/users/doctors/test_schedule_generator.py
"""Expansión de un patrón semanal a turnos concretos. Sin base de datos."""
import datetime as dt

from src.app.api.v1.users.doctors.doctor_schedule.generator import (
    SlotCandidate,
    TimeBlock,
    expand_pattern,
    leftover_minutes,
    split_by_overlap,
)

LUNES = dt.date(2026, 8, 10)      # es lunes
DOMINGO = dt.date(2026, 8, 16)


def t(h, m=0):
    return dt.time(h, m)


class TestExpansion:
    def test_una_franja_se_parte_en_turnos_exactos(self):
        slots = expand_pattern(
            weekdays={0},
            blocks=[TimeBlock(t(8), t(12))],
            slot_minutes=30,
            date_from=LUNES,
            date_to=LUNES,
        )
        assert len(slots) == 8
        assert slots[0] == SlotCandidate(LUNES, t(8), t(8, 30))
        assert slots[-1] == SlotCandidate(LUNES, t(11, 30), t(12))

    def test_el_sobrante_de_la_franja_se_descarta(self):
        """8:00-12:00 en turnos de 45 min da 5 turnos; los 15 min finales se van."""
        slots = expand_pattern(
            weekdays={0},
            blocks=[TimeBlock(t(8), t(12))],
            slot_minutes=45,
            date_from=LUNES,
            date_to=LUNES,
        )
        assert len(slots) == 5
        assert slots[-1].end_time == t(11, 45)

    def test_varias_franjas_suman(self):
        slots = expand_pattern(
            weekdays={0},
            blocks=[TimeBlock(t(8), t(12)), TimeBlock(t(14), t(17))],
            slot_minutes=30,
            date_from=LUNES,
            date_to=LUNES,
        )
        assert len(slots) == 8 + 6

    def test_solo_los_dias_seleccionados(self):
        slots = expand_pattern(
            weekdays={0, 2, 4},                      # lunes, miércoles, viernes
            blocks=[TimeBlock(t(8), t(9))],
            slot_minutes=60,
            date_from=LUNES,
            date_to=DOMINGO,
        )
        assert [s.date_of_service.weekday() for s in slots] == [0, 2, 4]

    def test_rango_de_varias_semanas(self):
        slots = expand_pattern(
            weekdays={0, 1, 2, 3, 4},
            blocks=[TimeBlock(t(8), t(12)), TimeBlock(t(14), t(17))],
            slot_minutes=30,
            date_from=LUNES,
            date_to=LUNES + dt.timedelta(days=27),   # 4 semanas
        )
        assert len(slots) == 14 * 5 * 4

    def test_franja_mas_corta_que_un_turno_no_genera_nada(self):
        slots = expand_pattern(
            weekdays={0},
            blocks=[TimeBlock(t(8), t(8, 20))],
            slot_minutes=30,
            date_from=LUNES,
            date_to=LUNES,
        )
        assert slots == []

    def test_los_turnos_salen_ordenados(self):
        slots = expand_pattern(
            weekdays={0},
            blocks=[TimeBlock(t(14), t(17)), TimeBlock(t(8), t(12))],
            slot_minutes=60,
            date_from=LUNES,
            date_to=LUNES,
        )
        assert slots == sorted(slots, key=lambda s: (s.date_of_service, s.start_time))


class TestColisiones:
    def test_un_turno_que_choca_se_omite(self):
        candidatos = expand_pattern(
            weekdays={0}, blocks=[TimeBlock(t(8), t(10))],
            slot_minutes=60, date_from=LUNES, date_to=LUNES,
        )
        aceptados, omitidos = split_by_overlap(
            candidatos, {LUNES: [(t(9), t(10))]}
        )
        assert [s.start_time for s in aceptados] == [t(8)]
        assert [s.start_time for s in omitidos] == [t(9)]

    def test_solape_parcial_tambien_cuenta(self):
        candidatos = [SlotCandidate(LUNES, t(9), t(10))]
        aceptados, omitidos = split_by_overlap(
            candidatos, {LUNES: [(t(9, 30), t(10, 30))]}
        )
        assert aceptados == []
        assert len(omitidos) == 1

    def test_turnos_pegados_no_chocan(self):
        """8:00-9:00 y 9:00-10:00 comparten un borde, no se solapan."""
        candidatos = [SlotCandidate(LUNES, t(9), t(10))]
        aceptados, omitidos = split_by_overlap(
            candidatos, {LUNES: [(t(8), t(9))]}
        )
        assert len(aceptados) == 1
        assert omitidos == []

    def test_sin_existentes_pasan_todos(self):
        candidatos = expand_pattern(
            weekdays={0}, blocks=[TimeBlock(t(8), t(12))],
            slot_minutes=30, date_from=LUNES, date_to=LUNES,
        )
        aceptados, omitidos = split_by_overlap(candidatos, {})
        assert len(aceptados) == 8
        assert omitidos == []


class TestSobrante:
    def test_reporta_los_minutos_que_se_pierden(self):
        assert leftover_minutes([TimeBlock(t(8), t(12))], 45) == 15

    def test_sin_sobrante_devuelve_cero(self):
        assert leftover_minutes([TimeBlock(t(8), t(12))], 30) == 0

    def test_suma_el_sobrante_de_cada_franja(self):
        sobra = leftover_minutes(
            [TimeBlock(t(8), t(12)), TimeBlock(t(14), t(17))], 45
        )
        assert sobra == 15 + 15
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_schedule_generator.py -q`
Expected: FAIL — `ModuleNotFoundError: generator`.

- [ ] **Step 3: Escribir el generador**

```python
# src/app/api/v1/users/doctors/doctor_schedule/generator.py
"""
Expansión de un patrón semanal a turnos concretos.

Sin base de datos y sin FastAPI a propósito: es la lógica que más fácil se
rompe (aritmética de horas, bordes de franja, solapes) y así se prueba sola.
"""
import datetime as dt
from dataclasses import dataclass
from typing import Iterable, Mapping, Sequence


@dataclass(frozen=True)
class TimeBlock:
    """Una franja de atención dentro del día."""
    start: dt.time
    end: dt.time


@dataclass(frozen=True, order=True)
class SlotCandidate:
    """Un turno reservable. Todavía no existe en la base."""
    date_of_service: dt.date
    start_time: dt.time
    end_time: dt.time


def _minutes(value: dt.time) -> int:
    return value.hour * 60 + value.minute


def _time(minutes: int) -> dt.time:
    return dt.time(minutes // 60, minutes % 60)


def _dates_in_range(
    date_from: dt.date, date_to: dt.date, weekdays: set[int]
) -> Iterable[dt.date]:
    dia = date_from
    while dia <= date_to:
        if dia.weekday() in weekdays:
            yield dia
        dia += dt.timedelta(days=1)


def expand_pattern(
    weekdays: set[int],
    blocks: Sequence[TimeBlock],
    slot_minutes: int,
    date_from: dt.date,
    date_to: dt.date,
) -> list[SlotCandidate]:
    """
    Convierte el patrón en turnos concretos, ordenados por fecha y hora.

    El resto de cada franja se descarta: con 8:00-12:00 y turnos de 45 min
    salen 5 turnos y los últimos 15 minutos no se publican, porque un hueco
    de 15 minutos no es una consulta.
    """
    ordenadas = sorted(blocks, key=lambda b: _minutes(b.start))
    slots: list[SlotCandidate] = []

    for dia in _dates_in_range(date_from, date_to, weekdays):
        for bloque in ordenadas:
            cursor = _minutes(bloque.start)
            fin = _minutes(bloque.end)
            while cursor + slot_minutes <= fin:
                slots.append(
                    SlotCandidate(dia, _time(cursor), _time(cursor + slot_minutes))
                )
                cursor += slot_minutes

    return slots


def split_by_overlap(
    candidates: Sequence[SlotCandidate],
    existing: Mapping[dt.date, Sequence[tuple[dt.time, dt.time]]],
) -> tuple[list[SlotCandidate], list[SlotCandidate]]:
    """
    Separa los candidatos en (aceptados, omitidos) según choquen con lo ya
    publicado. Dos turnos que comparten un borde no se solapan.

    Recibe los existentes ya cargados: comprobar contra la base turno por
    turno serían cientos de consultas.
    """
    aceptados: list[SlotCandidate] = []
    omitidos: list[SlotCandidate] = []
    # Los aceptados se van acumulando por día: dentro de un mismo patrón dos
    # franjas mal definidas podrían pisarse entre ellas.
    tomados: dict[dt.date, list[tuple[int, int]]] = {}

    for slot in candidates:
        inicio, fin = _minutes(slot.start_time), _minutes(slot.end_time)
        previos = [
            (_minutes(a), _minutes(b))
            for a, b in existing.get(slot.date_of_service, ())
        ]
        previos += tomados.get(slot.date_of_service, [])

        if any(inicio < otro_fin and fin > otro_inicio
               for otro_inicio, otro_fin in previos):
            omitidos.append(slot)
        else:
            aceptados.append(slot)
            tomados.setdefault(slot.date_of_service, []).append((inicio, fin))

    return aceptados, omitidos


def leftover_minutes(blocks: Sequence[TimeBlock], slot_minutes: int) -> int:
    """Minutos que quedan sin publicar al final de las franjas, en un día."""
    return sum(
        (_minutes(b.end) - _minutes(b.start)) % slot_minutes for b in blocks
    )
```

- [ ] **Step 4: Correr los tests**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_schedule_generator.py -q`
Expected: PASS (16 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/users/doctors/doctor_schedule/generator.py tests/
git commit -m "feat(horarios): expansion de patron semanal a turnos"
```

---

### Task 3: Schemas del lote, con sus validaciones

**Files:**
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/users/doctors/doctor_schedule/schemas.py`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/users/doctors/test_bulk_schedule_schemas.py`

**Interfaces:**
- Consumes: `TimeBlock` de Task 2 (solo conceptualmente; el schema define el suyo).
- Produces:
  - `TimeBlockIn(start_time: time, end_time: time)`
  - `BulkScheduleCreate(weekdays, blocks, slot_minutes, date_from, date_to, office_id, dry_run)`
  - `BulkScheduleDelete(date_from, date_to, weekdays, office_id, dry_run)`
  - `SkippedSlot(date, start_time, end_time, reason)`
  - `BulkScheduleResult(created, skipped, skipped_details, leftover_minutes_per_day, dry_run)`
  - `BulkDeleteResult(deleted, kept, kept_details, dry_run)`
  - Constantes `ALLOWED_SLOT_MINUTES`, `MAX_RANGE_DAYS`, `MAX_SLOTS_PER_REQUEST`.

- [ ] **Step 1: Escribir los tests que fallan**

```python
# tests/unit/api/v1/users/doctors/test_bulk_schedule_schemas.py
"""Los límites viven en el schema: salen como 422 antes de tocar la base."""
import datetime as dt
import uuid

import pytest
from pydantic import ValidationError

from src.app.api.v1.users.doctors.doctor_schedule.schemas import (
    BulkScheduleCreate,
    MAX_RANGE_DAYS,
)

HOY = dt.date.today()
OFICINA = uuid.uuid4()


def cuerpo(**cambios):
    base = dict(
        weekdays=[0, 1, 2, 3, 4],
        blocks=[{"start_time": "08:00", "end_time": "12:00"}],
        slot_minutes=30,
        date_from=HOY,
        date_to=HOY + dt.timedelta(days=7),
        office_id=OFICINA,
    )
    base.update(cambios)
    return base


def test_cuerpo_valido_pasa():
    modelo = BulkScheduleCreate(**cuerpo())
    assert modelo.slot_minutes == 30
    assert modelo.dry_run is False


@pytest.mark.parametrize("weekdays", [[], [0, 0], [7], [-1]])
def test_dias_invalidos(weekdays):
    with pytest.raises(ValidationError):
        BulkScheduleCreate(**cuerpo(weekdays=weekdays))


def test_franja_invertida():
    with pytest.raises(ValidationError, match="inicio"):
        BulkScheduleCreate(**cuerpo(
            blocks=[{"start_time": "12:00", "end_time": "08:00"}]
        ))


def test_franjas_que_se_solapan():
    with pytest.raises(ValidationError, match="solapan"):
        BulkScheduleCreate(**cuerpo(blocks=[
            {"start_time": "08:00", "end_time": "12:00"},
            {"start_time": "11:00", "end_time": "15:00"},
        ]))


def test_sin_franjas():
    with pytest.raises(ValidationError):
        BulkScheduleCreate(**cuerpo(blocks=[]))


@pytest.mark.parametrize("minutos", [5, 25, 90, 0])
def test_duracion_no_permitida(minutos):
    with pytest.raises(ValidationError):
        BulkScheduleCreate(**cuerpo(slot_minutes=minutos))


def test_fecha_final_antes_que_inicial():
    with pytest.raises(ValidationError, match="posterior"):
        BulkScheduleCreate(**cuerpo(date_to=HOY - dt.timedelta(days=1)))


def test_fecha_inicial_en_el_pasado():
    with pytest.raises(ValidationError, match="pasado"):
        BulkScheduleCreate(**cuerpo(date_from=HOY - dt.timedelta(days=1)))


def test_rango_demasiado_largo():
    with pytest.raises(ValidationError, match=str(MAX_RANGE_DAYS)):
        BulkScheduleCreate(**cuerpo(
            date_to=HOY + dt.timedelta(days=MAX_RANGE_DAYS + 1)
        ))
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_bulk_schedule_schemas.py -q`
Expected: FAIL — `ImportError: BulkScheduleCreate`.

- [ ] **Step 3: Escribir los schemas**

Añadir al final de `schemas.py`:

```python
import datetime as _dt
from typing import Literal
from pydantic import BaseModel, Field, field_validator, model_validator

ALLOWED_SLOT_MINUTES = (15, 20, 30, 45, 60)
MAX_RANGE_DAYS = 180
MAX_SLOTS_PER_REQUEST = 2000


class TimeBlockIn(BaseModel):
    start_time: _dt.time
    end_time: _dt.time

    @model_validator(mode="after")
    def _inicio_antes_del_fin(self):
        if self.start_time >= self.end_time:
            raise ValueError("La hora de inicio debe ser menor a la hora de fin.")
        return self


class BulkScheduleCreate(BaseModel):
    """Patrón semanal a expandir. 0 = lunes … 6 = domingo."""

    weekdays: list[int] = Field(min_length=1)
    blocks: list[TimeBlockIn] = Field(min_length=1)
    slot_minutes: Literal[15, 20, 30, 45, 60]
    date_from: _dt.date
    date_to: _dt.date
    office_id: uuid.UUID
    dry_run: bool = False

    @field_validator("weekdays")
    @classmethod
    def _dias_validos(cls, valor: list[int]) -> list[int]:
        if len(set(valor)) != len(valor):
            raise ValueError("Hay días repetidos.")
        if any(d < 0 or d > 6 for d in valor):
            raise ValueError("Los días van de 0 (lunes) a 6 (domingo).")
        return valor

    @model_validator(mode="after")
    def _franjas_sin_solape(self):
        ordenadas = sorted(self.blocks, key=lambda b: b.start_time)
        for previo, siguiente in zip(ordenadas, ordenadas[1:]):
            if siguiente.start_time < previo.end_time:
                raise ValueError("Las franjas del día se solapan entre ellas.")
        return self

    @model_validator(mode="after")
    def _rango_valido(self):
        if self.date_from < _dt.date.today():
            raise ValueError("La fecha inicial no puede estar en el pasado.")
        if self.date_to < self.date_from:
            raise ValueError("La fecha final debe ser posterior a la inicial.")
        if (self.date_to - self.date_from).days > MAX_RANGE_DAYS:
            raise ValueError(
                f"El rango no puede superar {MAX_RANGE_DAYS} días."
            )
        return self


class BulkScheduleDelete(BaseModel):
    date_from: _dt.date
    date_to: _dt.date
    weekdays: list[int] | None = None
    office_id: uuid.UUID | None = None
    dry_run: bool = False

    @model_validator(mode="after")
    def _rango_valido(self):
        if self.date_to < self.date_from:
            raise ValueError("La fecha final debe ser posterior a la inicial.")
        return self


class SkippedSlot(BaseModel):
    date_of_service: _dt.date
    start_time: _dt.time
    end_time: _dt.time
    reason: Literal["overlap", "booked"]


class BulkScheduleResult(BaseModel):
    created: int
    skipped: int
    skipped_details: list[SkippedSlot]
    #: Minutos que sobran al final de las franjas en un día. La UI lo avisa.
    leftover_minutes_per_day: int
    dry_run: bool


class BulkDeleteResult(BaseModel):
    deleted: int
    kept: int
    kept_details: list[SkippedSlot]
    dry_run: bool
```

Verificar que `import uuid` ya esté en la cabecera del archivo; si no, agregarlo.

- [ ] **Step 4: Correr los tests**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_bulk_schedule_schemas.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/users/doctors/doctor_schedule/schemas.py tests/
git commit -m "feat(horarios): schemas y limites del lote"
```

---

### Task 4: CRUD del lote

**Files:**
- Modify: `FesamedCare-Backend-v2/src/app/crud/crud_schedules.py`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/users/doctors/test_bulk_schedule_crud.py`

**Interfaces:**
- Consumes: `expand_pattern`, `split_by_overlap`, `leftover_minutes`, `TimeBlock` (Task 2); `BulkScheduleCreate`, `BulkScheduleDelete`, `BulkScheduleResult`, `BulkDeleteResult`, `SkippedSlot` (Task 3).
- Produces:
  - `async def bulk_create_schedules(doctor_id: UUID, data: BulkScheduleCreate, db: AsyncSession) -> BulkScheduleResult`
  - `async def bulk_delete_schedules(doctor_id: UUID, data: BulkScheduleDelete, db: AsyncSession) -> BulkDeleteResult`
  - `async def get_booked_schedule_ids(schedule_ids: list[UUID], db: AsyncSession) -> set[UUID]`

- [ ] **Step 1: Escribir el test que falla**

Se prueba contra la base real dentro de una transacción que se revierte, como
ya se hizo para verificar el índice único. `conftest.py` no trae fixture de
sesión real, así que este archivo crea la suya.

```python
# tests/unit/api/v1/users/doctors/test_bulk_schedule_crud.py
"""
CRUD del lote, contra la base real en transacciones revertidas.
Las funciones puras ya están cubiertas en test_schedule_generator.py; aquí
se prueba lo que solo se puede probar con base: colisiones con lo publicado,
atomicidad y respeto por las citas activas.
"""
import datetime as dt
import uuid

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.api.v1.users.doctors.doctor_schedule.models import DoctorSchedule
from src.app.api.v1.users.doctors.doctor_schedule.schemas import (
    BulkScheduleCreate,
    BulkScheduleDelete,
)
from src.app.core.db.database import async_engine
from src.app.crud.crud_schedules import bulk_create_schedules, bulk_delete_schedules


@pytest_asyncio.fixture
async def db():
    """Sesión que siempre revierte: la base queda como estaba."""
    async with AsyncSession(async_engine) as sesion:
        yield sesion
        await sesion.rollback()


@pytest_asyncio.fixture
async def doctor_y_oficina(db: AsyncSession):
    fila = await db.execute(text(
        "SELECT doctor_id, id FROM consulting_office LIMIT 1"
    ))
    par = fila.first()
    if par is None:
        pytest.skip("la base de desarrollo no tiene consultorios")
    return par[0], par[1]


def patron(office_id, **cambios):
    lunes = dt.date.today() + dt.timedelta(days=(7 - dt.date.today().weekday()) % 7 or 7)
    base = dict(
        weekdays=[lunes.weekday()],
        blocks=[{"start_time": "08:00", "end_time": "12:00"}],
        slot_minutes=30,
        date_from=lunes,
        date_to=lunes,
        office_id=office_id,
    )
    base.update(cambios)
    return BulkScheduleCreate(**base)


@pytest.mark.asyncio
async def test_crea_los_turnos_del_patron(db, doctor_y_oficina):
    doctor_id, office_id = doctor_y_oficina
    resultado = await bulk_create_schedules(doctor_id, patron(office_id), db)
    assert resultado.created == 8
    assert resultado.skipped == 0
    assert resultado.dry_run is False


@pytest.mark.asyncio
async def test_dry_run_no_escribe(db, doctor_y_oficina):
    doctor_id, office_id = doctor_y_oficina
    antes = (await db.execute(text("SELECT count(*) FROM doctor_schedule"))).scalar_one()
    resultado = await bulk_create_schedules(
        doctor_id, patron(office_id, dry_run=True), db
    )
    despues = (await db.execute(text("SELECT count(*) FROM doctor_schedule"))).scalar_one()
    assert resultado.created == 8
    assert resultado.dry_run is True
    assert antes == despues


@pytest.mark.asyncio
async def test_omite_los_que_chocan_sin_abortar(db, doctor_y_oficina):
    doctor_id, office_id = doctor_y_oficina
    p = patron(office_id)
    db.add(DoctorSchedule(
        doctor_id=doctor_id, office_id=office_id,
        date_of_service=p.date_from,
        start_time=dt.time(9, 0), end_time=dt.time(9, 30), is_active=True,
    ))
    await db.flush()

    resultado = await bulk_create_schedules(doctor_id, p, db)
    assert resultado.created == 7
    assert resultado.skipped == 1
    assert resultado.skipped_details[0].start_time == dt.time(9, 0)
    assert resultado.skipped_details[0].reason == "overlap"


@pytest.mark.asyncio
async def test_reporta_el_sobrante(db, doctor_y_oficina):
    doctor_id, office_id = doctor_y_oficina
    resultado = await bulk_create_schedules(
        doctor_id, patron(office_id, slot_minutes=45, dry_run=True), db
    )
    assert resultado.created == 5
    assert resultado.leftover_minutes_per_day == 15


@pytest.mark.asyncio
async def test_borra_el_rango(db, doctor_y_oficina):
    doctor_id, office_id = doctor_y_oficina
    p = patron(office_id)
    await bulk_create_schedules(doctor_id, p, db)

    resultado = await bulk_delete_schedules(
        doctor_id,
        BulkScheduleDelete(date_from=p.date_from, date_to=p.date_to),
        db,
    )
    assert resultado.deleted == 8
    assert resultado.kept == 0
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_bulk_schedule_crud.py -q`
Expected: FAIL — `ImportError: bulk_create_schedules`.

- [ ] **Step 3: Escribir el CRUD**

Añadir a `crud_schedules.py`:

```python
from src.app.api.v1.users.doctors.doctor_schedule.generator import (
    TimeBlock,
    expand_pattern,
    leftover_minutes,
    split_by_overlap,
)
from src.app.api.v1.users.doctors.doctor_schedule.schemas import (
    BulkDeleteResult,
    BulkScheduleCreate,
    BulkScheduleDelete,
    BulkScheduleResult,
    SkippedSlot,
)


async def get_booked_schedule_ids(
    schedule_ids: list[UUID], db: AsyncSession
) -> set[UUID]:
    """
    Cuáles de esos horarios tienen una cita activa.

    En bloque, no uno por uno: has_appoinments hace una consulta por horario
    y aquí pueden ser cientos.
    """
    if not schedule_ids:
        return set()

    canceladas = [
        AppointmentStatus.CANCELED_BY_PATIENT,
        AppointmentStatus.CANCELED_BY_DOCTOR,
    ]
    result = await db.execute(
        select(Appointment.schedule_id).where(
            Appointment.schedule_id.in_(schedule_ids),
            Appointment.status.notin_(canceladas),
        )
    )
    return set(result.scalars().all())


async def bulk_create_schedules(
    doctor_id: UUID, data: BulkScheduleCreate, db: AsyncSession
) -> BulkScheduleResult:
    """Expande el patrón y lo inserta en una sola transacción."""
    candidatos = expand_pattern(
        weekdays=set(data.weekdays),
        blocks=[TimeBlock(b.start_time, b.end_time) for b in data.blocks],
        slot_minutes=data.slot_minutes,
        date_from=data.date_from,
        date_to=data.date_to,
    )

    # Los existentes se cargan una vez. Validar solape por turno serían
    # cientos de consultas.
    existentes = await get_doctor_schedules_by_date_range(
        doctor_id, data.date_from, data.date_to, db
    )
    por_fecha: dict[datetime.date, list[tuple[datetime.time, datetime.time]]] = {}
    for s in existentes:
        por_fecha.setdefault(s.date_of_service, []).append((s.start_time, s.end_time))

    aceptados, omitidos = split_by_overlap(candidatos, por_fecha)

    if not data.dry_run and aceptados:
        db.add_all([
            DoctorSchedule(
                doctor_id=doctor_id,
                office_id=data.office_id,
                date_of_service=slot.date_of_service,
                start_time=slot.start_time,
                end_time=slot.end_time,
                is_active=True,
            )
            for slot in aceptados
        ])
        await db.flush()

    return BulkScheduleResult(
        created=len(aceptados),
        skipped=len(omitidos),
        skipped_details=[
            SkippedSlot(
                date_of_service=s.date_of_service,
                start_time=s.start_time,
                end_time=s.end_time,
                reason="overlap",
            )
            for s in omitidos
        ],
        leftover_minutes_per_day=leftover_minutes(
            [TimeBlock(b.start_time, b.end_time) for b in data.blocks],
            data.slot_minutes,
        ),
        dry_run=data.dry_run,
    )


async def bulk_delete_schedules(
    doctor_id: UUID, data: BulkScheduleDelete, db: AsyncSession
) -> BulkDeleteResult:
    """Libera un rango, conservando los turnos con cita activa."""
    horarios = await get_doctor_schedules_by_date_range(
        doctor_id, data.date_from, data.date_to, db
    )

    if data.weekdays is not None:
        dias = set(data.weekdays)
        horarios = [h for h in horarios if h.date_of_service.weekday() in dias]
    if data.office_id is not None:
        horarios = [h for h in horarios if h.office_id == data.office_id]

    reservados = await get_booked_schedule_ids([h.id for h in horarios], db)

    borrables = [h for h in horarios if h.id not in reservados]
    conservados = [h for h in horarios if h.id in reservados]

    if not data.dry_run:
        ahora = datetime.datetime.now(datetime.UTC)
        for h in borrables:
            h.deleted_at = ahora
        await db.flush()

    return BulkDeleteResult(
        deleted=len(borrables),
        kept=len(conservados),
        kept_details=[
            SkippedSlot(
                date_of_service=h.date_of_service,
                start_time=h.start_time,
                end_time=h.end_time,
                reason="booked",
            )
            for h in conservados
        ],
        dry_run=data.dry_run,
    )
```

Verificar que `Appointment` y `AppointmentStatus` ya estén importados en el
archivo (los usa `has_appoinments`).

- [ ] **Step 4: Correr los tests**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_bulk_schedule_crud.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/crud/crud_schedules.py tests/
git commit -m "feat(horarios): crud de creacion y borrado por lote"
```

---

### Task 5: Los dos endpoints

**Files:**
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/users/doctors/doctor_schedule/router.py`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/users/doctors/test_bulk_schedule_router.py`

**Interfaces:**
- Consumes: `bulk_create_schedules`, `bulk_delete_schedules` (Task 4); schemas (Task 3).
- Produces: `POST /me/schedules/bulk/` y `DELETE /me/schedules/bulk/`.

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/unit/api/v1/users/doctors/test_bulk_schedule_router.py
"""Reglas del endpoint: perfil aprobado, consultorio propio, tope de turnos."""
import datetime as dt
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.app.api.v1.users.doctors.doctor_schedule.router import (
    write_bulk_doctor_schedule,
)
from src.app.api.v1.users.doctors.doctor_schedule.schemas import (
    BulkScheduleCreate,
    MAX_SLOTS_PER_REQUEST,
)
from src.app.api.v1.users.exceptions import BadRequestException

PREFIX = "src.app.api.v1.users.doctors.doctor_schedule.router."
LUNES = dt.date.today() + dt.timedelta(days=(7 - dt.date.today().weekday()) % 7 or 7)


def cuerpo(**cambios):
    base = dict(
        weekdays=[0, 1, 2, 3, 4],
        blocks=[{"start_time": "08:00", "end_time": "12:00"}],
        slot_minutes=30,
        date_from=LUNES,
        date_to=LUNES + dt.timedelta(days=7),
        office_id=uuid.uuid4(),
    )
    base.update(cambios)
    return BulkScheduleCreate(**base)


def usuario():
    u = MagicMock()
    u.id = uuid.uuid4()
    return u


@pytest.mark.asyncio
async def test_perfil_sin_aprobar_no_puede_publicar():
    puntero = MagicMock(approved_version_id=None)
    with patch(f"{PREFIX}get_pointer", new=AsyncMock(return_value=puntero)):
        with pytest.raises(BadRequestException, match="verificado"):
            await write_bulk_doctor_schedule(cuerpo(), usuario(), AsyncMock())


@pytest.mark.asyncio
async def test_consultorio_ajeno_se_rechaza():
    puntero = MagicMock(approved_version_id=uuid.uuid4())
    oficina = MagicMock(doctor_id=uuid.uuid4())      # de otro doctor
    with patch(f"{PREFIX}get_pointer", new=AsyncMock(return_value=puntero)), \
         patch(f"{PREFIX}get_office_by_id", new=AsyncMock(return_value=oficina)):
        with pytest.raises(BadRequestException, match="no pertenece"):
            await write_bulk_doctor_schedule(cuerpo(), usuario(), AsyncMock())


@pytest.mark.asyncio
async def test_el_tope_de_turnos_dice_cuantos_y_que_hacer():
    """El 400 no puede ser genérico: tiene que ser accionable."""
    user = usuario()
    puntero = MagicMock(approved_version_id=uuid.uuid4())
    oficina = MagicMock(doctor_id=user.id)
    # 7 días x 32 turnos x 180 días supera el tope
    grande = cuerpo(
        weekdays=[0, 1, 2, 3, 4, 5, 6],
        blocks=[{"start_time": "08:00", "end_time": "20:00"}],
        slot_minutes=15,
        date_to=LUNES + dt.timedelta(days=120),
    )
    with patch(f"{PREFIX}get_pointer", new=AsyncMock(return_value=puntero)), \
         patch(f"{PREFIX}get_office_by_id", new=AsyncMock(return_value=oficina)):
        with pytest.raises(BadRequestException) as exc:
            await write_bulk_doctor_schedule(grande, user, AsyncMock())

    mensaje = str(exc.value)
    assert str(MAX_SLOTS_PER_REQUEST) in mensaje
    assert "acorta" in mensaje.lower()
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/users/doctors/test_bulk_schedule_router.py -q`
Expected: FAIL — `ImportError: write_bulk_doctor_schedule`.

- [ ] **Step 3: Escribir los endpoints**

```python
@doctor_schedule_router.post('/me/schedules/bulk/', response_model=BulkScheduleResult)
async def write_bulk_doctor_schedule(
    data: BulkScheduleCreate,
    current_user: Annotated[User, Depends(get_current_doctor)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> BulkScheduleResult:
    """
    Publica un patrón semanal completo.

    Con `dry_run` no escribe: devuelve los mismos conteos para la vista previa.
    """
    ptr = await get_pointer(current_user.id, db)
    if ptr.approved_version_id is None:
        raise BadRequestException("Este perfil no ha sido verificado por FesamedCare.")

    office = await get_office_by_id(data.office_id, db)
    if office is None:
        raise NotFoundException('Oficina no encontrada.')
    if office.doctor_id != current_user.id:
        raise BadRequestException('La oficina no pertenece al profesional especificado.')

    # El tope se comprueba contando antes de tocar la base. El mensaje dice
    # cuántos turnos salen y qué hacer: un "límite excedido" a secas deja al
    # doctor sin saber si el problema es el rango, la duración o los días.
    total = len(expand_pattern(
        weekdays=set(data.weekdays),
        blocks=[TimeBlock(b.start_time, b.end_time) for b in data.blocks],
        slot_minutes=data.slot_minutes,
        date_from=data.date_from,
        date_to=data.date_to,
    ))
    if total > MAX_SLOTS_PER_REQUEST:
        raise BadRequestException(
            f"Este patrón genera {total} turnos y el máximo por operación es "
            f"{MAX_SLOTS_PER_REQUEST}. Acorta el rango de fechas y publica en "
            f"dos pasos."
        )

    resultado = await bulk_create_schedules(current_user.id, data, db)
    if not data.dry_run:
        await db.commit()
    return resultado


@doctor_schedule_router.delete('/me/schedules/bulk/', response_model=BulkDeleteResult)
async def delete_bulk_doctor_schedule(
    data: BulkScheduleDelete,
    current_user: Annotated[User, Depends(get_current_doctor)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> BulkDeleteResult:
    """Libera un rango. Los turnos con cita activa se conservan y se informan."""
    resultado = await bulk_delete_schedules(current_user.id, data, db)
    if not data.dry_run:
        await db.commit()
    return resultado
```

Agregar a los imports del router: `BulkScheduleCreate`, `BulkScheduleDelete`,
`BulkScheduleResult`, `BulkDeleteResult`, `MAX_SLOTS_PER_REQUEST` desde
`schemas`; `TimeBlock`, `expand_pattern` desde `generator`;
`bulk_create_schedules`, `bulk_delete_schedules` desde `crud_schedules`.

- [ ] **Step 4: Correr los tests y la suite**

Run: `docker exec web python -m pytest -q`
Expected: todo verde.

- [ ] **Step 5: Verificar que las rutas quedaron registradas**

Run:
```bash
docker exec web python -c "
import src.app.main as m
print([r.path for r in m.app.routes if 'bulk' in r.path])"
```
Expected: las dos rutas.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/users/doctors/doctor_schedule/router.py tests/
git commit -m "feat(horarios): endpoints de lote con dry-run"
```

---

### Task 6: Cliente de API en el frontend

**Files:**
- Modify: `Fesamed-Front-End-NextJS/src/lib/schedule-api.ts`
- Create: `Fesamed-Front-End-NextJS/scripts/schedule-pattern.test.mjs`
- Create: `Fesamed-Front-End-NextJS/src/lib/schedulePattern.ts`

**Interfaces:**
- Consumes: los endpoints de Task 5.
- Produces:
  - Tipos `TimeBlockIn`, `BulkScheduleCreate`, `BulkScheduleDelete`, `SkippedSlot`, `BulkScheduleResult`, `BulkDeleteResult`.
  - `bulkCreateSchedules(data: BulkScheduleCreate): Promise<BulkScheduleResult>`
  - `bulkDeleteSchedules(data: BulkScheduleDelete): Promise<BulkDeleteResult>`
  - `WEEKDAY_PRESETS` y `countSlots(blocks, slotMinutes)` en `schedulePattern.ts`.

- [ ] **Step 1: Escribir el test que falla**

```js
// scripts/schedule-pattern.test.mjs
/**
 * Cuentas del patrón en el cliente. Sirven para pintar el resumen sin
 * esperar al servidor; el servidor sigue siendo la autoridad.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { WEEKDAY_PRESETS, countSlots } from '../src/lib/schedulePattern.ts';

describe('countSlots', () => {
  test('una franja exacta', () => {
    assert.equal(countSlots([{ start: '08:00', end: '12:00' }], 30), 8);
  });

  test('descarta el sobrante de la franja', () => {
    assert.equal(countSlots([{ start: '08:00', end: '12:00' }], 45), 5);
  });

  test('suma varias franjas', () => {
    assert.equal(
      countSlots([{ start: '08:00', end: '12:00' }, { start: '14:00', end: '17:00' }], 30),
      14
    );
  });

  test('una franja más corta que el turno no cuenta', () => {
    assert.equal(countSlots([{ start: '08:00', end: '08:20' }], 30), 0);
  });
});

describe('WEEKDAY_PRESETS', () => {
  test('lunes a viernes son 0..4', () => {
    assert.deepEqual(WEEKDAY_PRESETS.weekdays, [0, 1, 2, 3, 4]);
  });

  test('lunes a sábado son 0..5', () => {
    assert.deepEqual(WEEKDAY_PRESETS.monToSat, [0, 1, 2, 3, 4, 5]);
  });

  test('fin de semana son sábado y domingo', () => {
    assert.deepEqual(WEEKDAY_PRESETS.weekend, [5, 6]);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --experimental-strip-types --test scripts/schedule-pattern.test.mjs`
Expected: FAIL — no existe `schedulePattern.ts`.

- [ ] **Step 3: Escribir el módulo y el cliente**

```ts
// src/lib/schedulePattern.ts
/** 0 = lunes … 6 = domingo, igual que el backend y que date.weekday(). */
export const WEEKDAY_PRESETS = {
  weekdays: [0, 1, 2, 3, 4],
  monToSat: [0, 1, 2, 3, 4, 5],
  weekend: [5, 6],
} as const;

export interface PatternBlock {
  start: string; // "HH:MM"
  end: string;
}

function minutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Turnos que produce un día del patrón. Espeja `expand_pattern` del backend
 * para poder pintar el resumen sin ir al servidor; el servidor manda.
 */
export function countSlots(blocks: PatternBlock[], slotMinutes: number): number {
  if (!slotMinutes) return 0;
  return blocks.reduce((total, b) => {
    const span = minutes(b.end) - minutes(b.start);
    return total + (span > 0 ? Math.floor(span / slotMinutes) : 0);
  }, 0);
}
```

Y en `schedule-api.ts`:

```ts
export interface TimeBlockIn {
  start_time: string;
  end_time: string;
}

export interface BulkScheduleCreate {
  weekdays: number[];
  blocks: TimeBlockIn[];
  slot_minutes: number;
  date_from: string;
  date_to: string;
  office_id: string;
  dry_run?: boolean;
}

export interface BulkScheduleDelete {
  date_from: string;
  date_to: string;
  weekdays?: number[];
  office_id?: string;
  dry_run?: boolean;
}

export interface SkippedSlot {
  date_of_service: string;
  start_time: string;
  end_time: string;
  reason: "overlap" | "booked";
}

export interface BulkScheduleResult {
  created: number;
  skipped: number;
  skipped_details: SkippedSlot[];
  leftover_minutes_per_day: number;
  dry_run: boolean;
}

export interface BulkDeleteResult {
  deleted: number;
  kept: number;
  kept_details: SkippedSlot[];
  dry_run: boolean;
}

export async function bulkCreateSchedules(
  data: BulkScheduleCreate
): Promise<BulkScheduleResult> {
  return post<BulkScheduleResult>(`${BASE}/me/schedules/bulk/`, data);
}

export async function bulkDeleteSchedules(
  data: BulkScheduleDelete
): Promise<BulkDeleteResult> {
  return del<BulkDeleteResult>(`${BASE}/me/schedules/bulk/`, data);
}
```

Comprobar la firma de `del` en `src/lib/api.ts`: si no acepta cuerpo, ampliarla
para que lo pase a `fetch`. Un `DELETE` con cuerpo es válido en HTTP y FastAPI
lo acepta.

- [ ] **Step 4: Correr el test y el typecheck**

Run: `node --experimental-strip-types --test scripts/schedule-pattern.test.mjs && npx tsc --noEmit`
Expected: PASS y typecheck limpio.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schedulePattern.ts src/lib/schedule-api.ts scripts/
git commit -m "feat(horarios): cliente de api para el lote"
```

---

### Task 7: Textos en los dos idiomas

**Files:**
- Modify: `Fesamed-Front-End-NextJS/src/i18n/dictionaries/es.ts`
- Modify: `Fesamed-Front-End-NextJS/src/i18n/dictionaries/en.ts`

**Interfaces:**
- Produces: el namespace `pattern.*`, consumido por las tareas 8 y 9.

- [ ] **Step 1: Agregar el namespace en español**

Dentro del objeto `es`, antes de `nav`:

```ts
  pattern: {
    openCreate: "Publicar horario",
    openDelete: "Liberar rango",
    singleSlot: "Turno suelto",

    title: "Publicar horario recurrente",
    days: "Días",
    presetWeekdays: "Lunes a viernes",
    presetMonToSat: "Lunes a sábado",
    presetWeekend: "Fin de semana",

    blocks: "Franjas del día",
    addBlock: "Agregar franja",
    removeBlock: "Quitar franja",
    from: "Desde",
    to: "Hasta",
    duration: "Duración de cada cita",
    minutesShort: "min",
    office: "Consultorio",

    review: "Ver resumen",
    back: "Volver",
    publishCount: "Publicar {count} turnos",

    summaryTotal: "{count} turnos en {days} días con atención",
    summaryPerDay: "{perDay} por día · del {from} al {to}",
    summarySkipped: "{count} se omiten por chocar con horarios que ya tenías",
    summaryLeftover: "Sobran {minutes} min al final de las franjas",
    summaryEmpty: "Este patrón no genera ningún turno. Revisa los días y las franjas.",
    seeDetail: "ver",

    deleteTitle: "Liberar un rango",
    deleteSummary: "Se liberan {count} turnos",
    deleteKept: "{count} se conservan porque ya tienen cita agendada",
    deleteConfirm: "Liberar {count} turnos",
    deleteEmpty: "No hay turnos para liberar en ese rango.",

    created: "Se publicaron {count} turnos.",
    deleted: "Se liberaron {count} turnos.",
    createError: "No se pudo publicar el horario.",
    deleteError: "No se pudo liberar el rango.",
  },
```

- [ ] **Step 2: Agregar la traducción al inglés**

Dentro del objeto `en`, en la misma posición:

```ts
  pattern: {
    openCreate: "Publish schedule",
    openDelete: "Clear range",
    singleSlot: "Single slot",

    title: "Publish a recurring schedule",
    days: "Days",
    presetWeekdays: "Monday to Friday",
    presetMonToSat: "Monday to Saturday",
    presetWeekend: "Weekend",

    blocks: "Daily time ranges",
    addBlock: "Add range",
    removeBlock: "Remove range",
    from: "From",
    to: "To",
    duration: "Appointment length",
    minutesShort: "min",
    office: "Office",

    review: "Review",
    back: "Back",
    publishCount: "Publish {count} slots",

    summaryTotal: "{count} slots across {days} working days",
    summaryPerDay: "{perDay} per day · {from} to {to}",
    summarySkipped: "{count} skipped — they clash with slots you already had",
    summaryLeftover: "{minutes} min left over at the end of each range",
    summaryEmpty: "This pattern produces no slots. Check the days and ranges.",
    seeDetail: "see",

    deleteTitle: "Clear a range",
    deleteSummary: "{count} slots will be cleared",
    deleteKept: "{count} are kept because they already have an appointment",
    deleteConfirm: "Clear {count} slots",
    deleteEmpty: "No slots to clear in that range.",

    created: "{count} slots published.",
    deleted: "{count} slots cleared.",
    createError: "Couldn't publish the schedule.",
    deleteError: "Couldn't clear the range.",
  },
```

- [ ] **Step 3: Verificar que el tipo obliga a que estén sincronizados**

Run: `npx tsc --noEmit`
Expected: limpio. Si falta una clave en `en.ts`, el tipo `Dictionary` lo rechaza.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/dictionaries
git commit -m "feat(horarios): textos del horario recurrente"
```

---

### Task 8: Diálogo de horario recurrente

**Files:**
- Create: `Fesamed-Front-End-NextJS/src/app/ui/dashboard/RecurringScheduleDialog.tsx`

**Interfaces:**
- Consumes: `bulkCreateSchedules`, `BulkScheduleResult` (Task 6); `WEEKDAY_PRESETS`, `countSlots` (Task 6); `pattern.*` (Task 7); `DoctorOfficeBasic` de `schedule-api`.
- Produces: `<RecurringScheduleDialog open onOpenChange offices onPublished />`, donde `onPublished: (created: number) => void` avisa a la pantalla para que recargue el calendario.

- [ ] **Step 1: Escribir el componente**

Estructura, en un solo archivo:

- Estado: `weekdays: number[]`, `blocks: PatternBlock[]` (arranca con `[{start:"08:00", end:"12:00"}]`), `slotMinutes: number` (30), `dateFrom`, `dateTo` (hoy y hoy + 8 semanas), `officeId`, `preview: BulkScheduleResult | null`, `loading`, `error`.
- Vista **formulario** cuando `preview === null`; vista **resumen** cuando no.
- Atajos de días: tres botones que llaman a `setWeekdays([...WEEKDAY_PRESETS.weekdays])`, etc. Se marcan activos comparando conjuntos ordenados.
- Días sueltos: siete botones `rounded-full`, activos en azul (`bg-blue-500 text-white`), inactivos con borde gris.
- Franjas: lista con dos `TimePicker` (el componente ya existe en `@/components/TimePicker`) y un botón de quitar, deshabilitado si solo queda una. Debajo, "Agregar franja".
- Duración: control segmentado con `{15, 20, 30, 45, 60}`, mismo lenguaje que las pestañas de citas.
- Fechas: dos `<input type="date">` con `min` en hoy.
- Consultorio: el `Select` que ya usa el diálogo de turno suelto.
- Botón **Ver resumen**: llama `bulkCreateSchedules({...datos, dry_run: true})` y guarda en `preview`.
- Vista de resumen: `summaryTotal`, `summaryPerDay`, y solo si aplican, `summarySkipped` (con detalle colapsable) y `summaryLeftover`. Si `preview.created === 0`, muestra `summaryEmpty` y deshabilita publicar.
- Botón **Publicar {count} turnos**: repite la llamada con `dry_run: false`, llama `onPublished(created)` y cierra.
- El botón de publicar lleva el número: publicar cientos de citas a ciegas es la clase de acción que asusta con razón, y que el botón lo diga convierte el miedo en confirmación.

Deshabilitar **Ver resumen** si `weekdays.length === 0`, si alguna franja tiene
inicio ≥ fin, o si no hay consultorio.

- [ ] **Step 2: Verificar typecheck y lint**

Run: `npx tsc --noEmit && npx next lint --file src/app/ui/dashboard/RecurringScheduleDialog.tsx`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
git add src/app/ui/dashboard/RecurringScheduleDialog.tsx
git commit -m "feat(horarios): dialogo de horario recurrente con vista previa"
```

---

### Task 9: Diálogo de liberar rango e integración

**Files:**
- Create: `Fesamed-Front-End-NextJS/src/app/ui/dashboard/ClearRangeDialog.tsx`
- Modify: `Fesamed-Front-End-NextJS/src/app/ui/dashboard/availability.tsx`

**Interfaces:**
- Consumes: `bulkDeleteSchedules`, `BulkDeleteResult` (Task 6); `pattern.*` (Task 7); `RecurringScheduleDialog` (Task 8).
- Produces: la pantalla de disponibilidad con las tres acciones.

- [ ] **Step 1: Escribir `ClearRangeDialog`**

Mismo patrón que Task 8, más simple: dos fechas, días opcionales, consultorio
opcional, botón **Ver resumen** con `dry_run: true`, y resumen con
`deleteSummary` más `deleteKept` si `kept > 0` (con detalle colapsable).
Confirmar con `deleteConfirm`. Si `deleted === 0`, mostrar `deleteEmpty` y
deshabilitar.

- [ ] **Step 2: Integrar en la pantalla de disponibilidad**

En `availability.tsx`, sobre la grilla del calendario, sustituir el botón
"Agregar" suelto del panel del día por una fila de acciones:

```tsx
<div className="mb-5 flex flex-wrap items-center gap-2">
  <Button onClick={() => setShowPattern(true)} className="rounded-full">
    <CalendarRange className="mr-2 h-4 w-4" />
    {t("pattern.openCreate")}
  </Button>
  <Button variant="outline" onClick={openAddDialog} disabled={!canAddSlot}
          className="rounded-full">
    <Plus className="mr-2 h-4 w-4" />
    {t("pattern.singleSlot")}
  </Button>
  <Button variant="ghost" onClick={() => setShowClear(true)}
          className="rounded-full text-gray-500">
    {t("pattern.openDelete")}
  </Button>
</div>
```

El botón "Agregar" del panel del día se conserva: con un día ya seleccionado
sigue siendo el gesto más corto.

Montar los dos diálogos al final, y en `onPublished` / `onCleared` llamar a
`loadSlots()` para que el calendario refleje el cambio.

Las mismas condiciones que hoy deshabilitan "Agregar" (perfil sin aprobar, sin
consultorios) deben deshabilitar también "Publicar horario": ya existen como
`notApproved` y `missingOffices`.

- [ ] **Step 3: Verificar typecheck, lint y build**

Run: `npx tsc --noEmit && npx next lint && npx next build`
Expected: typecheck limpio, lint sin hallazgos nuevos, build correcto.

- [ ] **Step 4: Verificación manual**

Con el backend corriendo y una cuenta de doctor aprobada con consultorio:

1. Abrir `Publicar horario`, elegir "Lunes a viernes", franjas 08:00–12:00 y
   14:00–17:00, 30 min, dos meses. `Ver resumen` debe decir 14 por día.
2. Publicar. El calendario debe llenarse de puntos verdes.
3. Volver a publicar el mismo patrón: todos los turnos deben salir como
   omitidos por choque, y no debe crearse nada.
4. `Liberar rango` sobre las mismas fechas: debe borrar todo.
5. Volver a publicar el mismo patrón: debe funcionar. Ese es el caso que el
   índice único de la Task 1 desbloquea.

- [ ] **Step 5: Commit**

```bash
git add src/app/ui/dashboard/ClearRangeDialog.tsx src/app/ui/dashboard/availability.tsx
git commit -m "feat(horarios): liberar rango e integracion en disponibilidad"
```

---

## Autorevisión del plan

**Cobertura del spec.** Migración → Task 1. Contrato de creación → Tasks 3 y 5.
Generación y sobrante → Task 2. Colisiones → Tasks 2 y 4. Borrado por lote y
turnos con cita → Tasks 3, 4 y 5. Límites con error accionable → Tasks 3 y 5.
Interacción, atajos, vista previa y botón con número → Tasks 7, 8 y 9. Pruebas
→ dentro de cada tarea. El único punto del spec sin tarea propia es el riesgo
de medir el tiempo de inserción de 2000 filas: se cubre en la verificación
manual de la Task 9, paso 4, publicando dos meses de jornada completa.

**Consistencia de tipos.** `SlotCandidate` usa `date_of_service` en las tres
tareas donde aparece (2, 3, 4). `SkippedSlot` es el mismo schema para
`skipped_details` y `kept_details`, con `reason` de `"overlap"` o `"booked"`.
`countSlots` en el frontend devuelve turnos por día, igual que
`leftover_minutes` cuenta minutos por día: ambos son magnitudes diarias, y el
resumen las multiplica por los días con atención.

**Sin marcadores.** Ningún TBD ni "manejar errores apropiadamente": los
mensajes, los límites y las condiciones de deshabilitado están escritos.
