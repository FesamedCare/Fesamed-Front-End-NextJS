# Verificación de perfil de doctor

## Para el doctor: qué ver en el panel

En el **panel del doctor** (dashboard y editar perfil) se muestra una tarjeta de **estado de verificación** que indica:

1. **Porcentaje de completado** y lista de **qué falta** para llegar al 100%.
2. Si el perfil está **en revisión** (ya llegó al 100% y quedó en cola).
3. Si fue **aprobado** o **rechazado**.

Los ítems que se tienen en cuenta para el 100% son (misma lógica que el backend):

| Requisito | Puntos | Dónde completarlo |
|-----------|--------|-------------------|
| Descripción profesional | 10 | Información general |
| Foto de perfil | 10 | Información general |
| Número de tarjeta profesional | 10 | Información general |
| Al menos un idioma | 10 | Información general |
| Al menos una especialidad | 10 | Información general |
| Al menos una universidad | 10 | Información general |
| Al menos una enfermedad tratada | 10 | Información general |
| Al menos un servicio | 5 | Información general |
| Al menos un certificado | 5 | Pestaña Certificados |
| Correo verificado | 5 | Configuración / correo |
| Teléfono verificado | 5 | Configuración / teléfono |
| Al menos un consultorio | 10 | Pestaña Consultorios |

**Total: 100 puntos.** Cuando el borrador llega al 100%, el backend marca esa versión como **UNDER_REVIEW** y entra en la cola de revisión. No hace falta que el doctor pulse “Enviar”: se considera enviado al completar el 100%.

---

## Dónde se aprueba la solicitud (admin)

La aprobación o rechazo la hace un **administrador** usando la API del backend. Hoy el front no tiene pantalla de administración; la revisión se hace contra estos endpoints (usuario con rol **admin**):

### Cola de revisión (versiones en revisión)

- **GET** `/api/v1/admin/review-queue/`  
  - Lista las versiones de perfil con `status = UNDER_REVIEW` y `completion_percentage >= 100`.  
  - Query params opcionales: `q` (buscar por nombre/apellido/email), `sort` (`updated_at` o `-updated_at`).

- **GET** `/api/v1/admin/review-queue/{version_id}/`  
  - Detalle de una versión (diff frente a la aprobada actual, si existe) para revisar antes de aprobar o rechazar.

### Aprobar

- **POST** `/api/v1/admin/review-queue/{version_id}/approve/`  
  - Marca la versión como aprobada y la asocia al doctor (`DoctorProfilePointer.approved_version_id = version_id`).  
  - El doctor pasa a aparecer en la búsqueda de doctores.  
  - Se envía email de “perfil aprobado” al doctor.

### Rechazar

- **POST** `/api/v1/admin/review-queue/{version_id}/reject/`  
  - Body: `{ "reject_reason": "texto" }`.  
  - Marca la versión como rechazada y guarda el motivo.  
  - El doctor puede ver el motivo (en el backend está en la versión); se envía email de rechazo.

Base URL: la del backend (ej. `NEXT_PUBLIC_API_URL`). Las peticiones deben ir con cookies/sesión de un usuario **admin**.

Para tener una “pantalla” donde se aprueba, habría que construir un **panel de administración** en el front que:

1. Llame a `GET /api/v1/admin/review-queue/` y muestre la lista.
2. Al elegir una versión, llame a `GET /api/v1/admin/review-queue/{version_id}/` y muestre el detalle.
3. Ofrezca botones “Aprobar” y “Rechazar” que llamen a los POST anteriores.

Hasta entonces, la aprobación se puede hacer con Swagger/OpenAPI del backend, Postman, o cualquier cliente que use esos endpoints con un admin autenticado.
