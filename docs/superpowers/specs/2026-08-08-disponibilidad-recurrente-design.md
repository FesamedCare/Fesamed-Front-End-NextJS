# Disponibilidad recurrente para doctores

**Fecha:** 2026-08-08
**Estado:** aprobado, pendiente de plan de implementación
**Alcance:** los dos repos, `Fesamed-Front-End-NextJS` y `FesamedCare-Backend-v2`

## Problema

El doctor solo puede publicar su disponibilidad **un turno a la vez**. La pantalla de disponibilidad abre un diálogo por turno y cada uno es una petición.

Un doctor con jornada normal —lunes a viernes, 8:00 a 12:00 y 14:00 a 17:00, consultas de 30 minutos, dos meses por delante— tiene que abrir ese diálogo **560 veces**. Nadie lo hace dos veces. El resultado práctico es que la agenda queda vacía y el paciente no encuentra con quién agendar, que es el objetivo del producto.

Esto ya se había señalado en el audit de frontend del 2026-08-07 como el problema de fondo de la funcionalidad: la pantalla estaba bien construida, el modelo debajo era el que no escalaba.

### Lo que se verificó (2026-08-08, con backend y base corriendo)

- **Una fila de `doctor_schedule` es una cita reservable, no un bloque de agenda.** `appointments/router.py:73` llama a `is_schedule_booked` y rechaza la reserva si ya hay otra cita sobre ese registro. Por eso un bloque de 8:00 a 15:00 no puede guardarse como una fila: el primer paciente en reservar se llevaría la jornada completa. La expansión a turnos es obligatoria, no una preferencia de diseño.
- **No existe creación por lote.** `doctor_schedule/router.py:34` es `POST /me/schedule/` y crea uno.
- **La validación de solape consulta la base en cada llamada.** `crud_schedules.py:79`, `check_schedule_overlap`, ejecuta un `SELECT` por invocación. Usarla por turno serían 560 consultas además de las 560 inserciones.
- **El borrado es lógico.** `doctor_schedule/router.py:137` marca `deleted_at` y rechaza el borrado si el turno tiene una cita activa (`crud_schedules.py:30`, `has_appoinments`, que excluye las canceladas).
- **La restricción única no contempla el borrado lógico.** `doctor_schedule/models.py:42` declara `UniqueConstraint('doctor_id', 'date_of_service', 'start_time', 'end_time')` sin `deleted_at`. Comprobado contra la base real, en una transacción revertida:

  ```
  1) turno creado
  2) borrado (soft delete, deleted_at)
  3) recreado idéntico -> REVIENTA
     UniqueViolationError: duplicate key value violates
     constraint "doctor_unique_schedule"
  ```

  Es un bug que ya está en producción: borrar un turno y volver a crearlo con la misma fecha y hora devuelve un 500. Hoy pasa desapercibido porque con la UI actual ese camino es raro. Con creación por lote deja de serlo: "me equivoqué de duración → borro el rango → lo rehago" es *el* camino de recuperación.
- **El paciente busca con dos meses de anticipación.** `doctor-booking-view.tsx:209` pide disponibilidad hasta `hoy + 2 meses`. Un patrón que genere menos deja el calendario del paciente vacío en las últimas semanas.
- **`get_doctor_schedules_by_date_range` (`crud_schedules.py:57`) ya filtra `deleted_at IS NULL`**, así que sirve tal cual para cargar los existentes de un rango en una sola consulta.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Duración de la cita | Se elige **por patrón** (15/20/30/45/60 min) | No necesita campo nuevo ni migración de perfiles, y permite consultas de 30 min entre semana y de 60 los sábados. Decisión de David. |
| Horizonte | **Fecha final explícita** que elige el doctor | Sin infraestructura nueva ni tarea de fondo. Se descartó la renovación automática con Celery. Decisión de David. |
| Día partido | **Varias franjas por día** | Más general que un campo de descanso: sirve para cualquier hueco, no solo el almuerzo. El formulario solo crece en un botón "agregar franja". Decisión de David. |
| Dónde se genera | **Endpoint de lote en el backend** | Ver "Enfoques considerados". Decisión de David. |
| Borrado por lote | **Entra en este cambio** | Sin él, equivocarse de duración deja al doctor con 560 turnos y ninguna salida. Decisión de David. |
| Colisiones | **Se omiten y se informan** | Rechazar 560 filas por 12 choques con turnos previos haría la función inutilizable. |
| Turnos con cita en el borrado | **Se conservan y se informan** | El endpoint de un turno ya rechaza borrar uno con cita activa. Por lote, rechazar todo por una cita sería peor que conservar esa y seguir. |

## Enfoques considerados

**A. Bucle en el cliente sobre `POST /me/schedule/`.** Descartado. No es lentitud: es corrupción. Si falla la petición 300 de 560, el doctor queda con media agenda publicada y sin forma de saber cuál mitad. Súmese 560 consultas de validación de solape.

**B. Endpoint de creación por lote.** Elegido. Una petición, una transacción, una carga de los horarios existentes. Devuelve qué creó y qué omitió. Con `dry_run` alimenta la vista previa.

**C. Tabla de reglas de recurrencia materializada por Celery.** Descartado *por ahora*. Es la solución correcta a largo plazo, pero trae preguntas que hoy no hace falta responder: qué pasa al editar una regla con citas ya reservadas, cómo se reconcilia una regla con turnos borrados a mano. Se puede migrar a C sin tirar B: el cuerpo que recibe B es exactamente lo que guardaría una regla.

## Diseño

### Migración

Una migración de Alembic reemplaza `doctor_unique_schedule` por un índice único **parcial**:

```sql
CREATE UNIQUE INDEX doctor_unique_schedule
    ON doctor_schedule (doctor_id, date_of_service, start_time, end_time)
    WHERE deleted_at IS NULL;
```

Los turnos borrados dejan de ocupar la llave. Arregla también el 500 del flujo de un solo turno.

Sin otros cambios de modelo: el patrón no se guarda, se expande a filas concretas, que es lo que el resto del sistema ya sabe manejar.

### `POST /me/schedules/bulk/`

```jsonc
{
  "weekdays": [0,1,2,3,4],           // 0=lunes … 6=domingo
  "blocks": [
    {"start_time": "08:00", "end_time": "12:00"},
    {"start_time": "14:00", "end_time": "17:00"}
  ],
  "slot_minutes": 30,
  "date_from": "2026-08-10",
  "date_to":   "2026-10-05",
  "office_id": "…",
  "dry_run": false
}
```

Respuesta, de la misma forma en dry-run que en real:

```jsonc
{
  "created": 548,
  "skipped": 12,
  "skipped_details": [
    {"date": "2026-08-12", "start_time": "09:00",
     "end_time": "09:30", "reason": "overlap"}
  ],
  "dry_run": false
}
```

### Generación

```
1. existentes = get_doctor_schedules_by_date_range(...)   ← 1 consulta
2. indexar existentes por fecha
3. por cada fecha del rango:
     si su día de semana no está en weekdays → siguiente
     por cada franja:
       cursor = franja.inicio
       mientras cursor + slot_minutes <= franja.fin:
         candidato = (fecha, cursor, cursor + slot_minutes)
         si choca con existentes[fecha] o con lo ya generado ese día:
              omitidos += candidato
         si no: creados += candidato
         cursor += slot_minutes
4. dry_run → devolver conteos sin escribir
   si no  → db.add_all(creados) y un solo commit
```

**El resto de la franja se descarta.** Franja 8:00–12:00 con turnos de 45 min da 5 turnos y sobran 15 minutos (11:45–12:00). Un hueco de 15 min no es una consulta. La vista previa lo dice explícitamente, porque si no el doctor cuenta 5 donde esperaba 5,33.

**Todo o nada.** Un solo `commit`. No existe el estado "se crearon 300 de 560".

### `DELETE /me/schedules/bulk/`

```jsonc
{
  "date_from": "…", "date_to": "…",
  "weekdays": [0,1,2,3,4],   // opcional
  "office_id": "…",          // opcional
  "dry_run": true
}
```

Respuesta: `{"deleted": 480, "kept": 8, "kept_details": [...]}`.

Espeja la generación: una consulta trae los turnos del rango, una segunda trae **en bloque** los `schedule_id` con cita activa, y se marca `deleted_at` sobre la diferencia. Los conservados se devuelven con fecha y hora para que el doctor sepa qué quedó vivo y por qué.

### Límites y validaciones

Todo en el schema de Pydantic, así que salen como 422 con el campo señalado antes de tocar la base:

- `weekdays` no vacío, sin repetidos, en rango 0–6.
- `blocks` no vacío; en cada franja `start_time < end_time`; las franjas no se solapan entre sí.
- `slot_minutes` en {15, 20, 30, 45, 60}.
- `date_from` no anterior a hoy; `date_from <= date_to`.
- Rango máximo **180 días**.
- Tope de **2000 turnos** por petición.

Los dos últimos existen para que nadie pida sin querer turnos de 5 minutos durante dos años.

**Los dos topes interactúan y hay que decirlo.** Un doctor de lunes a sábado, 8:00–12:00 y 14:00–18:00, con turnos de 15 minutos, genera 32 turnos al día: a 180 días son 4.992, muy por encima del tope de 2.000. Es un caso legítimo, no un error. Por eso el 422 de ese tope **no puede ser genérico**: debe decir cuántos turnos saldrían y sugerir acortar el rango de fechas, para que el doctor publique en dos o tres pasadas en vez de quedarse mirando un mensaje que no le dice qué hacer. Si la medición de la implementación muestra que 5.000 filas siguen insertándose en tiempo razonable, el tope sube y esta fricción desaparece; la decisión se toma con el número medido, no antes.

Reglas de negocio que ya aplican al endpoint de un turno y se mantienen: perfil aprobado (`approved_version_id is not None`) y consultorio propio del doctor.

### Interacción

El calendario mensual y el panel del día **se conservan**: son donde el doctor inspecciona y corrige, y eso sigue haciendo falta después de publicar 560 turnos. Lo que cambia es que dejan de ser la única forma de crear.

Sobre el calendario, tres acciones: `+ Turno suelto` (la de hoy), **`Publicar horario`** (primaria) y `Liberar rango`.

El diálogo de horario recurrente, en un paso más vista previa:

```
Días
  ( Lunes a viernes )  ( Lunes a sábado )  ( Fin de semana )
  [Lu][Ma][Mi][Ju][Vi][ Sa ][ Do ]

Franjas del día
  08:00  →  12:00                                    [x]
  14:00  →  17:00                                    [x]
  + agregar franja

Duración de cada cita
  ( 15 )( 20 )( 30 )( 45 )( 60 ) min

Desde  10/08/2026      Hasta  05/10/2026
Consultorio  ▾
                              [ Ver resumen → ]
```

Los tres atajos son los que pidió David. Debajo quedan los siete días sueltos, porque un doctor que atiende martes y jueves no entra en ningún atajo.

**Ver resumen** llama al endpoint con `dry_run: true`:

```
  548 turnos en 40 días con atención
  14 por día · lunes a viernes · del 10 ago al 5 oct
  ⚠ 12 se omiten por chocar con horarios que ya tenías   [ver]

              [ Volver ]   [ Publicar 548 turnos ]
```

El aviso de sobrante solo aparece cuando lo hay. En este ejemplo no: 4 h y 3 h
dividen exacto en turnos de 30 min. Con turnos de 45 min sí saldría.

El botón lleva el número. Publicar 548 citas a ciegas es la clase de acción que asusta con razón; que el botón lo diga convierte el miedo en confirmación.

**Liberar rango** usa el mismo patrón con `dry_run` primero, y su resumen distingue los conservados: *"Se liberan 480 turnos. 8 se conservan porque ya tienen cita agendada."*

Visualmente reusa el lenguaje ya establecido en el proyecto: píldoras `rounded-full` con azul activo (igual que las pestañas de citas y los filtros de búsqueda) y control segmentado para la duración.

## Lo que queda fuera

- **Editar un patrón publicado.** No hay patrón guardado que editar: hay 548 filas. Corregir es liberar el rango y volver a publicar. Por eso el borrado por lote entra en este cambio.
- **Horarios distintos por día dentro de un mismo patrón** (martes 8–12, jueves 14–18). Son dos patrones. Meterlo multiplicaría el formulario por siete para algo que se resuelve pulsando "Publicar" dos veces.
- **Renovación automática del horizonte.** Descartada al elegir fecha final explícita.
- **Zonas horarias.** El sistema ya asume `America/Bogota` (`appointments/router.py`, cálculo de `reminder_eta`). Este cambio no lo altera ni lo empeora.

## Pruebas

Backend, siguiendo la convención de `tests/unit/`:

- **Generación:** conteo correcto por franja; el sobrante de la franja se descarta; se filtran los días de semana no seleccionados; varias franjas suman.
- **Colisiones:** un turno preexistente se omite y aparece en `skipped_details`; no se aborta la operación.
- **Atomicidad:** si la inserción falla, no queda ninguna fila.
- **`dry_run`:** devuelve los mismos conteos y no escribe nada.
- **Límites:** 422 al exceder 180 días, 2000 turnos, duración no permitida o franjas solapadas.
- **Borrado:** nunca toca un turno con cita activa; lo devuelve en `kept_details`.
- **Regresión del índice único:** borrar un turno y recrearlo idéntico debe funcionar. Hoy da 500.

Frontend: test de la función que traduce el patrón a la petición (días, franjas, duración, rango), siguiendo la convención de `scripts/*.test.mjs`.

## Riesgos

- **La migración toca una restricción con datos en producción.** El índice parcial es más permisivo que el actual, así que no puede fallar por filas existentes. La bajada (`downgrade`) sí puede fallar si para entonces hay duplicados con `deleted_at`; se documenta en la propia migración.
- **2000 turnos en una transacción.** Medir el tiempo de la inserción en el peor caso durante la implementación. Si pasa de unos segundos, el tope baja antes de publicar la función, no después.
