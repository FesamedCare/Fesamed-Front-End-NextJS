# Ficha de la cita — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que al hacer clic en una cita se abra un diálogo con la información del otro y del consultorio, y que desde ahí se pueda saltar al perfil público del doctor.

**Architecture:** Sin tablas nuevas. Se ensanchan los schemas anidados de `AppointmentRead`, separados por rol para que el contacto personal del doctor no pueda filtrarse. Un endpoint nuevo devuelve el historial entre doctor y paciente. En el front, la tarjeta usa el patrón de enlace estirado y el perfil del doctor pasa a vivir en la URL.

**Tech Stack:** FastAPI · SQLAlchemy async · Pydantic v2 · pytest — Next.js 15 · React · TypeScript · Tailwind · shadcn/ui

## Global Constraints

- `DoctorInAppointment` **no** puede contener `email` ni `phone_number`. Hay un test que lo afirma; si alguien los añade, la suite rompe.
- El documento de identidad del paciente (`id_card`) no sale en ningún payload de cita.
- Los campos ausentes se omiten: nada de "—" ni etiquetas colgando.
- Ningún fallo del historial puede impedir que el diálogo se pinte.
- Comentarios y textos de usuario en español.
- Backend: `docker exec web python -m pytest`. Frontend: `npx tsc --noEmit`, `npx next lint`, `node --experimental-strip-types --test scripts/*.test.mjs`.

---

### Task 1: Schemas separados por rol

**Files:**
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/appointments/schemas.py:31-50`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/appointments/test_schemas.py`

**Interfaces:**
- Produces: `PatientInAppointment`, `DoctorInAppointment`, `OfficeInAppointment` ensanchado. `AppointmentRead.doctor` pasa a `DoctorInAppointment | None` y `AppointmentRead.patient` a `PatientInAppointment | None`.

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/unit/api/v1/appointments/test_schemas.py
"""
El contacto personal del doctor no puede salir en una cita.

Son dos schemas y no uno con opcionales por seguridad: si fuera un solo tipo
con `email: str | None`, un descuido publicaría el móvil del doctor. Que el
tipo no contenga el campo hace que no pueda filtrarse.
"""
from src.app.api.v1.appointments.schemas import (
    AppointmentRead,
    DoctorInAppointment,
    OfficeInAppointment,
    PatientInAppointment,
)


class TestDoctor:
    def test_no_expone_contacto_personal(self):
        campos = DoctorInAppointment.model_fields.keys()
        assert "email" not in campos
        assert "phone_number" not in campos

    def test_expone_lo_profesional(self):
        campos = DoctorInAppointment.model_fields.keys()
        for campo in ("specialties", "languages", "professional_card_number"):
            assert campo in campos


class TestPaciente:
    def test_expone_contacto(self):
        campos = PatientInAppointment.model_fields.keys()
        assert "email" in campos
        assert "phone_number" in campos

    def test_no_expone_el_documento(self):
        """id_card es el dato más sensible que guarda el sistema."""
        assert "id_card" not in PatientInAppointment.model_fields


class TestConsultorio:
    def test_expone_como_llegar_y_con_quien_hablar(self):
        campos = OfficeInAppointment.model_fields.keys()
        for campo in (
            "address", "city_name", "department_name",
            "phone_primary", "phone_secondary", "website_url",
        ):
            assert campo in campos


class TestCita:
    def test_los_dos_lados_usan_su_propio_tipo(self):
        assert AppointmentRead.model_fields["doctor"].annotation is not (
            AppointmentRead.model_fields["patient"].annotation
        )
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/appointments/test_schemas.py -q`
Expected: FAIL — `ImportError: DoctorInAppointment`.

- [ ] **Step 3: Escribir los schemas**

En `schemas.py`, reemplazar `OfficeInAppointment` y `UserInAppointment`:

```python
class OfficeInAppointment(CustomBaseModel):
    id: UUID
    name: str
    address: str
    city_name: Optional[str] = None
    department_name: Optional[str] = None
    phone_primary: Optional[str] = None
    phone_secondary: Optional[str] = None
    #: Sitio web o enlace de Google Maps. De aquí sale "Cómo llegar".
    website_url: Optional[str] = None


class PatientInAppointment(CustomBaseModel):
    """Lo que el doctor ve del paciente. Sin `id_card`, a propósito."""

    id: UUID
    name: str
    lastname: str
    profile_picture: PresignedPicture = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    #: El front calcula la edad; mandar la fecha evita recalcular en servidor.
    birth_date: Optional[date] = None
    gender: Optional[str] = None


class DoctorInAppointment(CustomBaseModel):
    """
    Lo que el paciente ve del doctor.

    Sin `email` ni `phone_number`: para hablar con el doctor está el chat.
    Exponer su móvil convertiría cada cita en una línea directa. No es un
    campo opcional que quedó vacío: no existe en el tipo.
    """

    id: UUID
    name: str
    lastname: str
    profile_picture: PresignedPicture = None
    specialties: list[str] = []
    languages: list[str] = []
    professional_card_number: Optional[str] = None
```

Y en `AppointmentRead`:

```python
    doctor: Optional[DoctorInAppointment] = None
    patient: Optional[PatientInAppointment] = None
```

Borrar `UserInAppointment` y comprobar con `grep -rn UserInAppointment src` que
no queda ningún uso.

- [ ] **Step 4: Correr los tests**

Run: `docker exec web python -m pytest tests/unit/api/v1/appointments/test_schemas.py -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/appointments/schemas.py tests/
git commit -m "feat(citas): schemas separados por rol para el detalle"
```

---

### Task 2: Rellenar el consultorio y las especialidades

**Files:**
- Create: `FesamedCare-Backend-v2/src/app/api/v1/appointments/enrich.py`
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/appointments/router.py:29-58`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/appointments/test_enrich.py`

**Interfaces:**
- Consumes: los schemas de Task 1.
- Produces: `async def approved_profiles_by_doctor(doctor_ids: list[UUID], db: AsyncSession) -> dict[UUID, DoctorProfileVersion]` y `def build_doctor(user, version) -> DoctorInAppointment`.

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/unit/api/v1/appointments/test_enrich.py
"""
Las especialidades del doctor no cuelgan del User: viven en la versión
aprobada de su perfil. Resolverlas por cita serían N consultas para una lista.
"""
import uuid
from unittest.mock import MagicMock

from src.app.api.v1.appointments.enrich import build_doctor


def enlace(nombre):
    e = MagicMock()
    e.specialty.name = nombre
    return e


def idioma(nombre):
    e = MagicMock()
    e.language.name = nombre
    return e


def usuario():
    u = MagicMock()
    u.id = uuid.uuid4()
    u.name = "David"
    u.lastname = "Patel"
    u.profile_picture = None
    return u


def test_toma_las_especialidades_de_la_version():
    version = MagicMock()
    version.specialties = [enlace("Cardiología"), enlace("Otorrino")]
    version.languages = [idioma("Español")]
    version.professional_card_number = "123456"

    doctor = build_doctor(usuario(), version)

    assert set(doctor.specialties) == {"Cardiología", "Otorrino"}
    assert doctor.languages == ["Español"]
    assert doctor.professional_card_number == "123456"


def test_sin_version_aprobada_no_falla():
    """
    Un doctor que perdió la aprobación después de que le agendaran. Devolver
    listas vacías es correcto; reventar dejaría al paciente sin ver su cita.
    """
    doctor = build_doctor(usuario(), None)

    assert doctor.specialties == []
    assert doctor.languages == []
    assert doctor.professional_card_number is None


def test_no_lleva_contacto_personal():
    doctor = build_doctor(usuario(), None)
    assert not hasattr(doctor, "email")
    assert not hasattr(doctor, "phone_number")
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/appointments/test_enrich.py -q`
Expected: FAIL — `ModuleNotFoundError: enrich`.

- [ ] **Step 3: Escribir el módulo**

```python
# src/app/api/v1/appointments/enrich.py
"""
Relleno de los datos que una cita necesita y su modelo no tiene a mano.

Las especialidades y los idiomas del doctor viven en la versión aprobada de su
perfil, no en el `User`. Resolver ese puntero una vez por cita serían cientos
de consultas para una lista larga, así que se resuelve en bloque.
"""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.api.v1.appointments.schemas import DoctorInAppointment
from src.app.api.v1.profile_verification.models import (
    DoctorProfilePointer,
    DoctorProfileVersion,
)


async def approved_profiles_by_doctor(
    doctor_ids: list[UUID], db: AsyncSession
) -> dict[UUID, DoctorProfileVersion]:
    """Versión aprobada de cada doctor, en una sola consulta."""
    if not doctor_ids:
        return {}

    stmt = (
        select(DoctorProfilePointer.user_id, DoctorProfileVersion)
        .join(
            DoctorProfileVersion,
            DoctorProfilePointer.approved_version_id == DoctorProfileVersion.id,
        )
        .where(DoctorProfilePointer.user_id.in_(doctor_ids))
    )
    filas = await db.execute(stmt)
    return {user_id: version for user_id, version in filas.all()}


def build_doctor(user, version: DoctorProfileVersion | None) -> DoctorInAppointment:
    """
    Arma el doctor de una cita.

    Sin versión aprobada devuelve listas vacías en vez de fallar: es un doctor
    cuyo perfil cambió de estado después de que le agendaran, y el paciente
    tiene derecho a seguir viendo su cita.
    """
    return DoctorInAppointment(
        id=user.id,
        name=user.name,
        lastname=user.lastname,
        profile_picture=user.profile_picture,
        specialties=(
            sorted({link.specialty.name for link in version.specialties})
            if version else []
        ),
        languages=(
            sorted({link.language.name for link in version.languages})
            if version else []
        ),
        professional_card_number=(
            version.professional_card_number if version else None
        ),
    )
```

Comprobar el nombre real de la relación de idiomas en
`profile_verification/models.py`; si no es `link.language.name`, ajustar aquí
y en el test.

- [ ] **Step 4: Usarlo en los dos endpoints de lectura**

En `router.py`, tanto `read_appointments` como `read_doctor_appointments`
resuelven los perfiles una vez y arman la respuesta:

```python
    citas = await get_appointments_by_user(current_user.id, db)
    perfiles = await approved_profiles_by_doctor(
        [c.doctor_id for c in citas if c.doctor_id], db
    )
    return [
        AppointmentRead.model_validate(c).model_copy(
            update={"doctor": build_doctor(c.doctor, perfiles.get(c.doctor_id))}
            if c.doctor else {}
        )
        for c in citas
    ]
```

Lo mismo en `read_appointment`, con una sola cita.

- [ ] **Step 5: Correr la suite**

Run: `docker exec web python -m pytest -q`
Expected: todo verde.

- [ ] **Step 6: Medir con datos reales**

El spec anota este riesgo. Con la base de desarrollo:

```bash
docker exec web python -c "
import asyncio, time
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from src.app.core.db.database import DATABASE_URL
from src.app.crud.crud_appointments import get_appointments_by_user
from src.app.api.v1.appointments.enrich import approved_profiles_by_doctor
from sqlalchemy import text

async def main():
    eng = create_async_engine(DATABASE_URL, future=True)
    async with AsyncSession(eng) as db:
        uid = (await db.execute(text('SELECT patient_id FROM appointment LIMIT 1'))).scalar()
        if uid is None:
            print('sin citas en la base'); return
        t0 = time.perf_counter()
        citas = await get_appointments_by_user(uid, db)
        perfiles = await approved_profiles_by_doctor([c.doctor_id for c in citas], db)
        print(f'{len(citas)} citas, {len(perfiles)} perfiles, {(time.perf_counter()-t0)*1000:.0f} ms')
    await eng.dispose()
asyncio.run(main())"
```

Si pasa de unos cientos de milisegundos, mover el relleno del doctor al
endpoint de detalle y dejar la lista con los datos básicos.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/appointments/ tests/
git commit -m "feat(citas): resolver especialidades del doctor en bloque"
```

---

### Task 3: Historial entre doctor y paciente

**Files:**
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/appointments/router.py`
- Modify: `FesamedCare-Backend-v2/src/app/api/v1/appointments/schemas.py`
- Modify: `FesamedCare-Backend-v2/src/app/crud/crud_appointments.py`
- Test: `FesamedCare-Backend-v2/tests/unit/api/v1/appointments/test_context.py`

**Interfaces:**
- Produces: `AppointmentContextRead(previous_count: int, last_visit: date | None)`, `async def count_previous_visits(doctor_id, patient_id, exclude_id, db) -> tuple[int, date | None]`, y `GET /appointment/{id}/context/`.

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/unit/api/v1/appointments/test_context.py
"""
El historial es solo para el doctor: al paciente no le aporta saber cuántas
veces ha ido, y exponerlo al revés filtraría el volumen de un consultorio.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.app.api.v1.appointments.router import read_appointment_context
from src.app.api.v1.users.exceptions import ForbiddenException, NotFoundException

PREFIX = "src.app.api.v1.appointments.router."


def cita(doctor_id, patient_id):
    c = MagicMock()
    c.id = uuid.uuid4()
    c.doctor_id = doctor_id
    c.patient_id = patient_id
    return c


def usuario(uid=None):
    u = MagicMock()
    u.id = uid or uuid.uuid4()
    return u


@pytest.mark.asyncio
async def test_el_doctor_ve_el_historial():
    d = usuario()
    c = cita(d.id, uuid.uuid4())
    with patch(f"{PREFIX}get_appointment_by_id", new=AsyncMock(return_value=c)), \
         patch(f"{PREFIX}count_previous_visits",
               new=AsyncMock(return_value=(3, None))):
        resultado = await read_appointment_context(c.id, d, AsyncMock())
    assert resultado.previous_count == 3


@pytest.mark.asyncio
async def test_el_paciente_no():
    c = cita(uuid.uuid4(), uuid.uuid4())
    with patch(f"{PREFIX}get_appointment_by_id", new=AsyncMock(return_value=c)):
        with pytest.raises(ForbiddenException):
            await read_appointment_context(c.id, usuario(c.patient_id), AsyncMock())


@pytest.mark.asyncio
async def test_un_doctor_ajeno_tampoco():
    c = cita(uuid.uuid4(), uuid.uuid4())
    with patch(f"{PREFIX}get_appointment_by_id", new=AsyncMock(return_value=c)):
        with pytest.raises(ForbiddenException):
            await read_appointment_context(c.id, usuario(), AsyncMock())


@pytest.mark.asyncio
async def test_cita_inexistente():
    with patch(f"{PREFIX}get_appointment_by_id", new=AsyncMock(return_value=None)):
        with pytest.raises(NotFoundException):
            await read_appointment_context(uuid.uuid4(), usuario(), AsyncMock())
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `docker exec web python -m pytest tests/unit/api/v1/appointments/test_context.py -q`
Expected: FAIL — `ImportError: read_appointment_context`.

- [ ] **Step 3: Escribir el CRUD**

En `crud_appointments.py`:

```python
async def count_previous_visits(
    doctor_id: UUID, patient_id: UUID, exclude_id: UUID, db: AsyncSession
) -> tuple[int, datetime.date | None]:
    """
    Cuántas citas completadas hubo antes entre ese doctor y ese paciente.

    Solo COMPLETED: una cancelada o una ausencia no son "citas contigo".
    """
    stmt = (
        select(func.count(Appointment.id), func.max(DoctorSchedule.date_of_service))
        .join(DoctorSchedule, Appointment.schedule_id == DoctorSchedule.id)
        .where(
            Appointment.doctor_id == doctor_id,
            Appointment.patient_id == patient_id,
            Appointment.id != exclude_id,
            Appointment.status == AppointmentStatus.COMPLETED,
        )
    )
    total, ultima = (await db.execute(stmt)).one()
    return total or 0, ultima
```

- [ ] **Step 4: Escribir el schema y el endpoint**

En `schemas.py`:

```python
class AppointmentContextRead(CustomBaseModel):
    """Historial entre el doctor y el paciente de una cita."""

    previous_count: int
    last_visit: Optional[date] = None
```

En `router.py`:

```python
@appointment_router.get(
    '/appointment/{appointment_id}/context/',
    response_model=AppointmentContextRead,
)
async def read_appointment_context(
    appointment_id: UUID,
    current_user: Annotated[User, Depends(get_current_doctor)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
) -> AppointmentContextRead:
    """
    Historial del paciente con este doctor.

    Aparte del detalle de la cita y no dentro: pedirlo en la lista serían N
    consultas para pintar algo que quizá nadie abra.
    """
    appointment = await get_appointment_by_id(appointment_id, db)
    if appointment is None:
        raise NotFoundException("Cita no encontrada.")

    if appointment.doctor_id != current_user.id:
        raise ForbiddenException("No tiene permisos para ver esta información.")

    total, ultima = await count_previous_visits(
        appointment.doctor_id, appointment.patient_id, appointment.id, db
    )
    return AppointmentContextRead(previous_count=total, last_visit=ultima)
```

- [ ] **Step 5: Correr la suite y ver la ruta**

Run: `docker exec web python -m pytest -q && curl -s http://localhost:8000/openapi.json | grep -o '/api/v1/appointment/{appointment_id}/context/'`
Expected: verde y la ruta presente.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/appointments/ src/app/crud/crud_appointments.py tests/
git commit -m "feat(citas): historial del paciente con su doctor"
```

---

### Task 4: El perfil del doctor pasa a la URL

**Files:**
- Modify: `Fesamed-Front-End-NextJS/src/app/ui/doctors/appointment-page/agendar-cita-content.tsx`
- Test: `Fesamed-Front-End-NextJS/scripts/doctor-profile-url.test.mjs`
- Create: `Fesamed-Front-End-NextJS/src/lib/doctorProfileUrl.ts`

**Interfaces:**
- Produces: `doctorProfileUrl(doctorId: string): string`, consumido por Task 6.

- [ ] **Step 1: Escribir el test que falla**

```js
// scripts/doctor-profile-url.test.mjs
/**
 * El perfil del doctor vivía en useState: no había URL que enlazar, el botón
 * atrás sacaba del sitio y refrescar perdía el perfil.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { DOCTOR_PARAM, doctorProfileUrl } from '../src/lib/doctorProfileUrl.ts';

describe('doctorProfileUrl', () => {
  test('apunta a la ruta pública con el doctor en el parámetro', () => {
    assert.equal(
      doctorProfileUrl('abc-123'),
      '/buscar-doctor?doctor=abc-123'
    );
  });

  test('escapa el identificador', () => {
    assert.ok(doctorProfileUrl('a b&c').includes('a%20b%26c'));
  });

  test('el nombre del parámetro es uno solo', () => {
    assert.equal(DOCTOR_PARAM, 'doctor');
    assert.ok(doctorProfileUrl('x').includes(`${DOCTOR_PARAM}=`));
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --experimental-strip-types --test scripts/doctor-profile-url.test.mjs`
Expected: FAIL — no existe el módulo.

- [ ] **Step 3: Escribir el módulo**

```ts
// src/lib/doctorProfileUrl.ts
/**
 * URL del perfil público de un doctor.
 *
 * Se usa el parámetro de consulta y no un segmento porque `/buscar-doctor` y
 * `/agendar-cita` montan hoy el mismo componente, y un segmento obligaría a
 * duplicarlo o a resolver antes esa duplicación.
 */
export const DOCTOR_PARAM = "doctor";

export function doctorProfileUrl(doctorId: string): string {
  return `/buscar-doctor?${DOCTOR_PARAM}=${encodeURIComponent(doctorId)}`;
}
```

- [ ] **Step 4: Leer el parámetro en vez del estado**

```tsx
// agendar-cita-content.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchAndResults } from "./search-and-results";
import { DoctorBookingView } from "./doctor-booking-view";
import { DOCTOR_PARAM } from "@/lib/doctorProfileUrl";

export function AgendarCitaContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedDoctorId = searchParams.get(DOCTOR_PARAM);

  // El doctor elegido vive en la URL y no en useState: así el boton atras
  // vuelve a los resultados en vez de sacar del sitio, refrescar mantiene el
  // perfil abierto, y un perfil se puede compartir.
  const abrir = (id: string) =>
    router.push(`${pathname}?${DOCTOR_PARAM}=${encodeURIComponent(id)}`);

  if (selectedDoctorId) {
    return (
      <DoctorBookingView
        doctorId={selectedDoctorId}
        onBack={() => router.push(pathname)}
      />
    );
  }

  return <SearchAndResults onSelectDoctor={abrir} />;
}
```

`useSearchParams` obliga a que el componente esté dentro de un `<Suspense>` en
build estático. Comprobar en el paso 5; si `next build` se queja, envolver
`<AgendarCitaContent />` en `<Suspense>` en `buscar-doctor/page.tsx` y en
`agendar-cita/page.tsx`.

- [ ] **Step 5: Verificar**

Run: `node --experimental-strip-types --test scripts/doctor-profile-url.test.mjs && npx tsc --noEmit && npx next build`
Expected: tests verdes, typecheck limpio, build correcto.

Con el servidor levantado, comprobar a mano:
`/buscar-doctor?doctor=<uuid>` abre el perfil directo; quitar el parámetro
devuelve a los resultados; el botón atrás también.

- [ ] **Step 6: Commit**

```bash
git add src/lib/doctorProfileUrl.ts src/app/ui/doctors/appointment-page/agendar-cita-content.tsx scripts/
git commit -m "feat(buscar-doctor): el perfil del doctor pasa a la URL"
```

---

### Task 5: Tipos y textos del front

**Files:**
- Modify: `Fesamed-Front-End-NextJS/src/app/types/types.tsx`
- Modify: `Fesamed-Front-End-NextJS/src/lib/appointments-api.ts`
- Modify: `Fesamed-Front-End-NextJS/src/i18n/dictionaries/es.ts`
- Modify: `Fesamed-Front-End-NextJS/src/i18n/dictionaries/en.ts`
- Create: `Fesamed-Front-End-NextJS/src/lib/age.ts`
- Test: `Fesamed-Front-End-NextJS/scripts/age.test.mjs`

**Interfaces:**
- Produces: `ageFrom(birthDate: string, today?: Date): number | null`, `getAppointmentContext(id)`, el namespace `detail.*`.

- [ ] **Step 1: Escribir el test de la edad**

```js
// scripts/age.test.mjs
/**
 * La edad en el borde del cumpleaños. Restar años sin mirar el día da un año
 * de más durante los meses previos.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ageFrom } from '../src/lib/age.ts';

describe('ageFrom', () => {
  test('el día antes del cumpleaños todavía no suma', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 13)), 31);
  });

  test('el día del cumpleaños suma', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 14)), 32);
  });

  test('el día después sigue igual', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 15)), 32);
  });

  test('un mes anterior no suma', () => {
    assert.equal(ageFrom('1994-12-31', new Date(2026, 0, 1)), 31);
  });

  test('sin fecha devuelve null', () => {
    assert.equal(ageFrom('', new Date(2026, 0, 1)), null);
  });

  test('una fecha inválida devuelve null', () => {
    assert.equal(ageFrom('no-es-fecha', new Date(2026, 0, 1)), null);
  });
});
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `node --experimental-strip-types --test scripts/age.test.mjs`
Expected: FAIL — no existe el módulo.

- [ ] **Step 3: Escribir el módulo**

```ts
// src/lib/age.ts
/**
 * Edad cumplida a partir de una fecha "yyyy-MM-dd".
 *
 * Se construye la fecha por partes y no con `new Date(iso)`: esa forma
 * interpreta medianoche UTC y en Bogotá cae el día anterior.
 */
export function ageFrom(birthDate: string, today: Date = new Date()): number | null {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;

  let edad = today.getFullYear() - y;
  const cumpleFue =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!cumpleFue) edad -= 1;

  return edad >= 0 ? edad : null;
}
```

- [ ] **Step 4: Ampliar los tipos y el cliente**

En `types.tsx`, dentro de `Appointment`, reemplazar los tipos de `doctor` y
`patient` por los nuevos y ampliar la oficina:

```ts
export interface OfficeInAppointment {
  id: string;
  name: string;
  address: string;
  city_name?: string | null;
  department_name?: string | null;
  phone_primary?: string | null;
  phone_secondary?: string | null;
  website_url?: string | null;
}

export interface DoctorInAppointment {
  id: string;
  name: string;
  lastname: string;
  profile_picture?: string | null;
  specialties: string[];
  languages: string[];
  professional_card_number?: string | null;
}

export interface PatientInAppointment {
  id: string;
  name: string;
  lastname: string;
  profile_picture?: string | null;
  email?: string | null;
  phone_number?: string | null;
  birth_date?: string | null;
  gender?: string | null;
}

export interface AppointmentContext {
  previous_count: number;
  last_visit?: string | null;
}
```

En `appointments-api.ts`:

```ts
/** Historial del paciente con este doctor. Solo lo puede pedir el doctor. */
export async function getAppointmentContext(
  id: string
): Promise<AppointmentContext> {
  return get<AppointmentContext>(`${BASE}/appointment/${id}/context/`);
}
```

- [ ] **Step 5: Añadir los textos**

En `es.ts`, antes de `nav`:

```ts
  detail: {
    title: "Detalle de la cita",
    where: "Dónde",
    history: "Historial",
    directions: "Cómo llegar",
    viewFullProfile: "Ver perfil completo del doctor",
    viewFullProfileHint:
      "Fotos del consultorio, métodos de pago y certificados",
    professionalCard: "Tarjeta profesional",
    speaks: "Habla",
    years: "{count} años",
    genderMale: "Masculino",
    genderFemale: "Femenino",
    genderOther: "Otro",
    visitsWithYou: "{count} citas contigo",
    oneVisitWithYou: "1 cita contigo",
    noVisitsWithYou: "Primera cita contigo",
    lastVisit: "última el {date}",
  },
```

Y en `en.ts`:

```ts
  detail: {
    title: "Appointment details",
    where: "Where",
    history: "History",
    directions: "Get directions",
    viewFullProfile: "View the doctor's full profile",
    viewFullProfileHint: "Office photos, payment methods and certificates",
    professionalCard: "License number",
    speaks: "Speaks",
    years: "{count} years old",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    visitsWithYou: "{count} appointments with you",
    oneVisitWithYou: "1 appointment with you",
    noVisitsWithYou: "First appointment with you",
    lastVisit: "last on {date}",
  },
```

- [ ] **Step 6: Verificar**

Run: `node --experimental-strip-types --test scripts/age.test.mjs && npx tsc --noEmit`
Expected: tests verdes; el typecheck señalará dónde `AppointmentsList` usa
campos que cambiaron de tipo. Arreglar esos usos.

- [ ] **Step 7: Commit**

```bash
git add src/lib/age.ts src/app/types/types.tsx src/lib/appointments-api.ts src/i18n/dictionaries scripts/
git commit -m "feat(citas): tipos, edad y textos del detalle"
```

---

### Task 6: El diálogo de detalle

**Files:**
- Create: `Fesamed-Front-End-NextJS/src/app/ui/dashboard/AppointmentDetailDialog.tsx`

**Interfaces:**
- Consumes: `getAppointmentContext` y los tipos (Task 5), `doctorProfileUrl` (Task 4).
- Produces: `<AppointmentDetailDialog appointment role open onOpenChange actions />`, donde `actions` es el `ReactNode` con los botones que ya arma la lista.

- [ ] **Step 1: Escribir el componente**

Estructura, en un archivo:

- Props: `appointment: Appointment | null`, `role: "patient" | "doctor"`, `open`, `onOpenChange`, `actions?: ReactNode`.
- Estado: `context: AppointmentContext | null`, `loadingContext: boolean`.
- `useEffect`: si `open && role === "doctor" && appointment`, pedir
  `getAppointmentContext(appointment.id)`. En `catch`, dejar `context` en
  `null` **sin** poner error visible: el historial es accesorio y su fallo no
  puede impedir que el diálogo se lea.
- Cabecera: fecha larga, hora, y la insignia de estado reutilizando
  `STATUS_KEYS` y `STATUS_COLORS` de `AppointmentsList` (exportarlos desde
  allí en vez de copiarlos).
- Cuerpo según rol:
  - **paciente**: foto grande, nombre, `specialties.join(" · ")`, tarjeta
    profesional si existe, `speaks` con `languages.join(", ")` si hay.
  - **doctor**: foto, nombre, `ageFrom(birth_date)` y género traducido en una
    línea, teléfono como `tel:` y correo como `mailto:`.
- Bloque **Dónde**: nombre del consultorio, dirección, `city_name,
  department_name` si existen, `phone_primary` como `tel:`, y el enlace
  `website_url` rotulado `detail.directions` **solo si la cita no ha pasado**.
- Bloque **Historial**, solo para el doctor y solo si `context` llegó:
  `noVisitsWithYou` / `oneVisitWithYou` / `visitsWithYou` según el número, más
  `lastVisit` si hay fecha.
- Solo para el paciente, enlace a `doctorProfileUrl(appointment.doctor.id)`
  con `detail.viewFullProfile` y debajo `detail.viewFullProfileHint` en gris.
- Pie: `{actions}`.
- Todo campo ausente se omite: sin "—" ni etiquetas colgando.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit && npx next lint --file src/app/ui/dashboard/AppointmentDetailDialog.tsx`
Expected: ambos limpios.

- [ ] **Step 3: Commit**

```bash
git add src/app/ui/dashboard/AppointmentDetailDialog.tsx
git commit -m "feat(citas): dialogo de detalle de la cita"
```

---

### Task 7: La tarjeta clicable

**Files:**
- Modify: `Fesamed-Front-End-NextJS/src/app/ui/dashboard/AppointmentsList.tsx`

**Interfaces:**
- Consumes: `AppointmentDetailDialog` (Task 6).

- [ ] **Step 1: Exportar lo compartido**

En `AppointmentsList.tsx`, marcar `STATUS_KEYS` y `STATUS_COLORS` como
`export` para que el diálogo los use en vez de copiarlos.

- [ ] **Step 2: Hacer la tarjeta clicable con enlace estirado**

La tarjeta pasa a `relative`. El nombre de la persona se envuelve en un
`<button>`:

```tsx
<button
  type="button"
  onClick={() => setDetailId(appt.id)}
  className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
>
  <h4 className="font-semibold text-base truncate">…</h4>
</button>
```

Y el contenedor de acciones sube por encima del pseudo-elemento:

```tsx
<div className="relative z-10 flex gap-2 shrink-0 flex-wrap">
```

No se envuelve la tarjeta entera en un `<button>`: ya contiene botones, y un
interactivo dentro de otro es HTML inválido y se comporta mal con teclado y
lectores de pantalla. Con el enlace estirado hay **un** elemento enfocable
para abrir el detalle y las acciones siguen enfocándose aparte.

- [ ] **Step 3: Montar el diálogo**

Estado `const [detailId, setDetailId] = useState<string | null>(null)` y, al
final del componente:

```tsx
<AppointmentDetailDialog
  appointment={appointments.find((a) => a.id === detailId) ?? null}
  role={role}
  open={detailId !== null}
  onOpenChange={(next) => !next && setDetailId(null)}
  actions={detailId ? renderActions(appointments.find((a) => a.id === detailId)!) : null}
/>
```

Extraer los botones de la tarjeta a `renderActions(appt: Appointment)` y usar
esa misma función en los dos sitios. Son las mismas funciones, no una copia:
así el diálogo respeta automáticamente las ventanas de tiempo del check-in.

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit && npx next lint && npx next build && node --experimental-strip-types --test scripts/*.test.mjs`
Expected: typecheck limpio, lint sin hallazgos nuevos, build correcto, tests verdes.

- [ ] **Step 5: Verificación manual**

Con backend y front corriendo, y una cuenta de paciente con al menos una cita:

1. Clic en cualquier punto de la tarjeta abre el diálogo; clic en un botón
   ejecuta la acción sin abrirlo.
2. Con teclado: `Tab` llega al nombre y `Enter` abre; `Tab` sigue a los
   botones de acción.
3. En una cita futura aparece "Cómo llegar"; en una pasada no.
4. El enlace del perfil abre `/buscar-doctor?doctor=<uuid>` con el perfil ya
   cargado.
5. Con una cuenta de doctor: aparecen edad, género, teléfono y correo del
   paciente, y la línea de historial.

- [ ] **Step 6: Commit**

```bash
git add src/app/ui/dashboard/AppointmentsList.tsx
git commit -m "feat(citas): la tarjeta abre el detalle"
```

---

## Autorevisión del plan

**Cobertura del spec.** Schemas por rol → Task 1. Especialidades en bloque y
su medición → Task 2. Historial → Task 3. URL del perfil → Task 4. Tipos,
edad y textos → Task 5. Diálogo, reglas de omisión y fallo tolerado del
historial → Task 6. Tarjeta clicable y acciones compartidas → Task 7. El
riesgo de que `AppointmentRead` cambie de forma se cubre en el paso 6 de la
Task 5, donde el typecheck señala los usos rotos.

**Consistencia de tipos.** `DoctorInAppointment` y `PatientInAppointment` se
llaman igual en backend (Task 1) y frontend (Task 5).
`AppointmentContextRead` en Python corresponde a `AppointmentContext` en
TypeScript; los campos `previous_count` y `last_visit` coinciden. `DOCTOR_PARAM`
se define una vez en Task 4 y se usa en Tasks 4 y 6.

**Sin marcadores.** Los textos, las reglas de omisión y las condiciones están
escritas. El único punto que exige comprobar el código antes de escribirlo
está señalado explícitamente: el nombre de la relación de idiomas en
`DoctorProfileVersion`, en el paso 3 de la Task 2.
