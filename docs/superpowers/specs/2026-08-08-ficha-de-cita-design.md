# Ficha de la cita

**Fecha:** 2026-08-08
**Estado:** aprobado, pendiente de plan de implementación
**Alcance:** los dos repos, `Fesamed-Front-End-NextJS` y `FesamedCare-Backend-v2`

## Problema

Un paciente que abre "Mis citas" ve la fecha, la hora, el nombre del doctor y una línea con el consultorio. No ve el teléfono, ni la ciudad, ni cómo llegar. Un doctor ve el nombre del paciente y nada más: si el paciente se retrasa, no tiene forma de llamarlo desde la plataforma.

La dirección **sí** viaja en la respuesta y **sí** se pinta, pero comprimida con `truncate` junto al nombre del consultorio en una sola línea (`AppointmentsList.tsx`), así que en la práctica no se lee.

Debajo hay bastante más que el modelo guarda y que nunca llega a la cita: teléfonos del consultorio, ciudad y departamento, enlace de sitio web o mapa, y del otro usuario su correo y su teléfono.

### Lo que se verificó (2026-08-08, con backend corriendo)

- `OfficeInAppointment` (`appointments/schemas.py:31`) expone solo `id`, `name`, `address`.
- `UserInAppointment` (`appointments/schemas.py:45`) expone solo `id`, `name`, `lastname`, `profile_picture`. Es el mismo schema para el doctor y para el paciente.
- `ConsultingOffice` (`doctor_offices/models.py:42-50`) sí tiene `address`, `postal_code`, `website_url`, `phone_primary`, `phone_secondary` y `city_id`, además de relaciones a ciudad y departamento.
- `User` tiene `email`, `phone_number`, `birth_date`, `gender`, `id_card`.
- **`GET /appointment/{id}/` sí valida permisos** (`appointments/router.py:39`): rechaza a quien no sea el paciente, el doctor o un admin. En la conversación se afirmó lo contrario a partir de un fragmento incompleto; queda anotado aquí para que nadie vaya a "arreglar" algo que ya está bien.
- No existe ningún endpoint que devuelva el historial entre un doctor y un paciente.
- **Las especialidades y los idiomas del doctor no cuelgan del `User`**: viven en la versión aprobada de su perfil (`DoctorProfileVersion.specialties`, vía `DoctorProfilePointer.approved_version_id`). Exponerlas en la cita exige resolver ese puntero, no basta con leer `appointment.doctor`.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Cómo se accede | **Clic en la tarjeta abre un diálogo** | La información no se despliega en la lista. Decisión de David. |
| Datos del paciente que ve el doctor | **Contacto y datos básicos**: nombre, foto, teléfono, correo, edad y género. Sin documento de identidad. | Suficiente para llamarlo si se retrasa; el documento es el dato más sensible que guarda el sistema y no hace falta para coordinar. Decisión de David. |
| Historial de citas previas | **Se muestra al doctor** ("3 citas contigo · última el 12 jun 2026") | Iba en la vista aprobada. Solo para el doctor: al paciente no le aporta. |
| Datos del doctor que ve el paciente | Profesionales y del consultorio. **Sin correo ni teléfono personales.** | Para hablar con el doctor está el chat, que es el proyecto siguiente. Exponer su móvil convertiría cada cita en una línea directa. |
| Acciones | **En la tarjeta y en el diálogo** | El gesto rápido se conserva y el diálogo permite actuar sobre lo que se acaba de leer. Decisión de David. |

## Diseño

### Schemas: uno por rol, no uno con opcionales

`UserInAppointment` se parte en dos:

```python
class PatientInAppointment(CustomBaseModel):
    id: UUID
    name: str
    lastname: str
    profile_picture: PresignedPicture = None
    email: str
    phone_number: str | None
    birth_date: date | None      # el front calcula la edad
    gender: str | None


class DoctorInAppointment(CustomBaseModel):
    id: UUID
    name: str
    lastname: str
    profile_picture: PresignedPicture = None
    specialties: list[str]
    languages: list[str]
    professional_card_number: str | None
    # Sin email ni phone_number, a propósito.
```

Son dos tipos y no uno con campos opcionales **por seguridad, no por estética**: el día que alguien devuelva el objeto completo por descuido, un schema único con `email: str | None` publicaría el móvil del doctor. Que el tipo no contenga el campo hace que no pueda filtrarse.

`AppointmentRead` pasa a `doctor: DoctorInAppointment | None` y `patient: PatientInAppointment | None`.

`OfficeInAppointment` se ensancha:

```python
class OfficeInAppointment(CustomBaseModel):
    id: UUID
    name: str
    address: str
    city_name: str | None
    department_name: str | None
    phone_primary: str
    phone_secondary: str | None
    website_url: str | None       # aquí vive el enlace de Maps
```

### Las especialidades exigen resolver el puntero

`appointment.doctor` es un `User` y no sabe nada de especialidades. Para llenar `DoctorInAppointment` hay que llegar a `DoctorProfileVersion` a través de `DoctorProfilePointer.approved_version_id`, como ya hace `doctors/router.py:253`.

Se hace **en bloque para toda la lista**, no por cita: `GET /appointment/` puede devolver decenas y resolver el puntero una vez por cita sería el mismo error que ya se corrigió en los horarios. Una consulta trae los perfiles aprobados de todos los doctores implicados y se arma un índice en memoria.

Si un doctor no tiene versión aprobada, `specialties` y `languages` salen como listas vacías. No es un error: es un doctor cuyo perfil cambió de estado después de que le agendaran.

### `GET /appointment/{id}/context/`

Nuevo endpoint, **solo para el doctor** de esa cita:

```jsonc
{
  "previous_count": 3,
  "last_visit": "2026-06-12"
}
```

Cuenta las citas `COMPLETED` entre ese doctor y ese paciente, excluyendo la actual. Se pide **al abrir el diálogo**, no en la lista: hacerlo en la lista serían N consultas para pintar algo que quizá nadie abra.

Un paciente que lo llame recibe 403.

### La tarjeta clicable

No se puede envolver la tarjeta en un `<button>`: ya contiene botones, y un elemento interactivo dentro de otro es HTML inválido y se comporta mal con teclado y lectores de pantalla.

Se usa el patrón de **enlace estirado**: el nombre de la persona pasa a ser el botón real, con `after:absolute after:inset-0` extendiendo su área de clic sobre toda la tarjeta (que es `relative`). Los botones de acción suben a `z-10`.

Resultado: **un** elemento enfocable para "abrir detalle", las acciones siguen siendo enfocables por separado, y el clic funciona en cualquier punto.

### El diálogo

Paciente:

```
  9:00 – 10:00 AM                    [Pendiente]

  (foto)  Dr. David Patel
          Cardiólogo · Otorrino
          Tarjeta profesional 123456
          Habla español, inglés
  ──────────────────────────────────────────────
  DÓNDE
  Consultorio Central
  Calle 123 # 45-67
  Cali, Valle del Cauca
   📞 +57 300 123 4567
   🗺  Cómo llegar                        ↗
  ──────────────────────────────────────────────
                              [Cancelar cita]
```

Doctor:

```
  (foto)  Camila Narváez
          32 años · Femenino
           📞 +57 300 123 4567
           ✉  camila@correo.com
  ──────────────────────────────────────────────
  HISTORIAL
  3 citas contigo · última el 12 jun 2026
  ──────────────────────────────────────────────
  DÓNDE
  Consultorio Central · Calle 123 # 45-67
  ──────────────────────────────────────────────
                 [No asistió]   [Check-in]
```

Reglas:

- **"Cómo llegar" solo en citas futuras.** En una cita de hace tres meses ese botón es ruido; el bloque *Dónde* se queda, sin el enlace.
- **Teléfono y correo son enlaces `tel:` y `mailto:`.** En móvil —donde un doctor mira esto cinco minutos antes— tocar el número debe llamar.
- **Las acciones del pie reutilizan las funciones de la lista**, no una copia, y respetan las mismas ventanas de tiempo: si el check-in aún no se puede, en el diálogo tampoco aparece.
- El diálogo se pinta con lo que la lista ya tiene; solo el historial llega después.

### Errores

**El historial no puede tumbar la ficha.** Si `GET /context/` falla, desaparece esa línea y el resto se muestra igual. Un dato accesorio no justifica un estado de error en toda la pantalla.

**Campos ausentes se omiten, no se muestran vacíos.** Un consultorio sin `website_url` no pinta "Cómo llegar"; un paciente sin `birth_date` no pinta la edad. Nada de "—" ni de etiquetas colgando.

## Pruebas

Backend:

- `DoctorInAppointment` **no** contiene `email` ni `phone_number`. Un test que lo afirme sobre `model_fields`, para que reañadirlos rompa la suite.
- `PatientInAppointment` sí los contiene.
- Las especialidades se resuelven desde la versión aprobada; un doctor sin versión aprobada devuelve listas vacías en vez de fallar.
- `GET /context/` devuelve 403 a un paciente y a un doctor ajeno.
- `previous_count` cuenta solo `COMPLETED` entre ese par y excluye la cita actual.

Frontend, siguiendo `scripts/*.test.mjs`:

- Cálculo de la edad en el borde del cumpleaños: el día antes, el día mismo y el día después.
- Que el enlace de mapa no se genere para una cita pasada.

## Lo que queda fuera

- **El chat.** Es el proyecto siguiente y tiene su propio spec. La ficha define dónde vive su botón.
- **Fotos del consultorio y métodos de pago.** Están en el modelo y se ven en el perfil público del doctor. En la ficha de una cita ya agendada no aportan: quien ya reservó no está eligiendo.
- **Documento de identidad del paciente.** Decisión explícita, ver la tabla de decisiones.

## Riesgos

- **`AppointmentRead` cambia de forma.** `doctor` y `patient` dejan de compartir tipo. El front los consume en `AppointmentsList` y en el tipo `Appointment` de `types.tsx`; hay que actualizar ambos o TypeScript lo señala.
- **La consulta en bloque de perfiles aprobados es nueva.** Medir con una lista de citas real antes de dar por buena la forma; si resulta pesada, la alternativa es resolver especialidades solo en el detalle y no en la lista.
