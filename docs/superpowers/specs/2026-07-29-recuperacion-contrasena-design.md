# Gestión de contraseñas en FesaMed

**Fecha:** 2026-07-29
**Estado:** aprobado, pendiente de plan de implementación
**Alcance:** los dos repos, `Fesamed-Front-End-NextJS` y `FesamedCare-Backend-v2`

## Problema

Un usuario que olvida su contraseña no tiene forma de recuperarla, y uno que quiere cambiarla tampoco. Nada de esto existe hoy.

El síntoma visible es un 404: `login-form.tsx:129` enlaza a `/forgot-password` y esa página no existe. Debajo hay bastante más.

### Lo que se verificó (2026-07-29, con front y back corriendo)

Los hallazgos se comprobaron sobre `feat/admin-module` y luego se reconfirmaron contra `origin/deploy-beta`, que es la rama base elegida. Los números de línea citados corresponden a `deploy-beta`.

- El backend no tiene ningún endpoint de contraseña. Cero coincidencias con `password`, `reset` o `forgot` entre las 71 rutas del `openapi.json`.
- `/dashboard/settings/change-password` se renderiza pero no hace nada: `ui/dashboard/config/changePassword.tsx:34` solo ejecuta `console.log`.
- El backend no valida contraseñas. `users/schemas.py:30` es `plain_password: str`, sin reglas. Las seis reglas existen solo en el front, en `ui/register/client-register-form.tsx:63-70`.
- `EmailTemplate.PASSWORD_RESET` existe en el enum de `core/email/providers/base.py` pero no tiene id en `BREVO_TEMPLATES`.
- `core/email/setup.py:11` compara `settings.ENVIRONMENT == 'prod'`. `EnvironmentOption` es un `Enum` plano y sus valores son `local`, `staging`, `production`, así que esa comparación es `False` siempre. Se comprobó dentro del contenedor forzando `ENVIRONMENT=production`: sigue devolviendo `SMTPProvider`. Brevo es código inalcanzable.
- `config.py` ya declara `RESET_TOKEN_SECRET` y `RESET_TOKEN_EXPIRE_MINUTES` (con 20 minutos por defecto, que es el valor actual en `src/.env`). `RESET_PASSWORD_RATE_LIMIT_MINUTES` en cambio existe solo en `src/.env` y en `src/.env.example`: nunca se declaró en `Settings`, así que hoy no hay forma de leerlo.
- `ui/auth/forgotPassword.tsx` es un componente huérfano del proyecto Vite anterior. Nadie lo importa, usa `import.meta.env.VITE_API_URL` y apunta a `/password/reset/message/:email`, que no existe.
- `TokenBlacklist` (`auth/models.py:81`) guarda solo `jti`, sin `user_id`.

### El patrón de referencia

La verificación de correo ya resuelve el problema equivalente y está en producción:

1. `crud_email_verification_token.py:13` genera `secrets.token_urlsafe(64)`, invalida los tokens previos sin usar del mismo usuario y guarda `expires_at`.
2. El correo lleva `{FRONTEND_URL}/verify-email?token=...` (`users/router.py:93`).
3. `app/verify-email/page.tsx` lee `?token=` con `useSearchParams` dentro de `Suspense` y hace POST.

Este diseño lo copia en lugar de inventar algo nuevo.

## Decisiones tomadas

| Decisión | Elección | Motivo |
|---|---|---|
| Enlace o código por correo | Enlace | Consistente con la verificación de correo, ya probada. Decisión de David. |
| Almacenamiento del token | Tabla nueva `password_reset_token` | El repo ya tiene este patrón resuelto para el caso idéntico. Un JWT con `RESET_TOKEN_SECRET` evitaría la migración pero obligaría a tocar el ternario de dos ramas en `auth/service.py:87` y a meter tokens de reset en una tabla que hoy es solo de access y refresh. |
| Respuesta ante correo inexistente | Siempre 200, mensaje neutro | No confirma qué correos tienen cuenta. En una plataforma médica, saber que alguien está registrado ya es información sobre esa persona. Decisión de David. |
| Rama de trabajo | Rama nueva desde `origin/deploy-beta` | Es la única que trae el limitador de tasa (`core/rate_limit/`) y `pytest` ya configurado. `feat/admin-module` no tiene ninguno de los dos, y un `/forgot-password` sin límite de tasa permite bombardear de correos a cualquier víctima. `deploy-beta` es superconjunto estricto de `feat/admin-module`, así que no se pierde nada. Decisión de David. |
| Cerrar sesión en todos los dispositivos | Fuera de alcance | Requiere columna nueva en `user` o `user_id` en `token_blacklist`, más migración y un cambio en `verify_token`. Correcto de hacer, no bloquea el MVP. |

## Preparación del entorno

Cambiar de rama a `deploy-beta` exige tres pasos antes de escribir código. `config.py` en esa rama declara dos variables sin valor por defecto, así que `Settings()` lanza excepción al importar si faltan.

1. Agregar a `src/.env`: `BETTERSTACK_SOURCE_TOKEN` y `BETTERSTACK_LOG_LEVEL`. En desarrollo el handler de Better Stack solo se engancha cuando `ENVIRONMENT` es `production`, así que un valor cualquiera sirve para el token local.
2. Renombrar las variables del admin por defecto: `ADMIN_EMAIL` y `ADMIN_PASSWORD` pasan a `DEFAULT_ADMIN_EMAIL` y `DEFAULT_ADMIN_PASSWORD`, y se agregan `DEFAULT_ADMIN_NAME`, `DEFAULT_ADMIN_LASTNAME` y `DEFAULT_ADMIN_PHONENUMBER`. Es lo que lee `scripts/bootstrap_admin.py`.
3. Reconstruir los contenedores. `deploy-beta` agrega dependencias a `requirements.txt` (`structlog`, `logtail-python`, `celery-redbeat`, `pytest`, `tenacity`) y usa `Dockerfile.dev` en vez del `Dockerfile` para el servicio `web`.

No hay migraciones nuevas entre `feat/admin-module` y `deploy-beta`, así que la base de datos actual sirve tal cual.

## Arquitectura

### Backend

**Modelo.** `PasswordResetToken` en `src/app/api/v1/auth/models.py`, con los mismos campos que `EmailVerificationToken`: `user_id` (FK a `user.id`), `token` (`String(100)`, único), `expires_at`, `used_at` (nullable), `id` (UUID). Una migración de Alembic. El head está único (`d5d750c9437f`), verificado.

**CRUD.** `src/app/crud/crud_password_reset_token.py`, clonando `crud_email_verification_token.py`:

- `create_reset_token(user_id, db, expires_in_minutes)` — invalida los previos sin usar, genera `secrets.token_urlsafe(64)`, persiste. El TTL sale de `settings.RESET_TOKEN_EXPIRE_MINUTES`.
- `consume_reset_token(token, db)` — devuelve el usuario si el token existe, no venció y no se usó; marca `used_at` y devuelve `None` en cualquier otro caso.

**Política de contraseña.** Módulo nuevo `src/app/api/v1/auth/password_policy.py`, con una única función `validate_password_policy(value: str) -> str` que lanza `ValueError` con mensaje en español. Va en su propio archivo, y no en `auth/utils.py`, para que `schemas.py` lo pueda importar sin arrastrar dependencias de base de datos.

Las seis reglas replican exactamente lo que ya valida `client-register-form.tsx:63-70`:

| Regla | Comprobación |
|---|---|
| Longitud | `len(value) >= 8` |
| Mayúscula | `[A-Z]` |
| Minúscula | `[a-z]` |
| Número | `[0-9]` |
| Carácter especial | `[!@#$%^&*(),.?":{}|<>]` |
| No trivial | no es `123456`, `password`, `qwerty` ni `abc123`, sin distinguir mayúsculas |

Se aplica en los tres endpoints nuevos **y** en `UserCreate.plain_password` de `users/schemas.py`, que hoy no valida nada del lado servidor. Ese último cambio entra aquí porque el reset y el registro comparten el mismo hueco: arreglar uno y dejar el otro abierto no tendría sentido.

**Endpoints.** Los tres van en `src/app/api/v1/auth/router.py`, junto a `login`, `logout` y `refresh`. Comparten el validador y el hasheo, y agruparlos mantiene el módulo cohesionado.

`POST /api/v1/forgot-password/`

- Body: `{ "email": EmailStr }`
- Siempre `200` con `{"message": "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."}`, exista el usuario o no.
- Si existe: crea token y encola el correo con `BackgroundTasks`, igual que el registro en `users/router.py:88`. Enlace: `{FRONTEND_URL}/reset-password?token=...`. Plantilla `EmailTemplate.PASSWORD_RESET` con `{"user_name": ..., "reset_url": ...}`.
- Limitado con `Depends(rate_limit(limit=3, period=settings.RESET_PASSWORD_RATE_LIMIT_MINUTES * 60))`, la fábrica de dependencias de `core/rate_limit/dependencies.py`. Identifica por id de usuario si hay sesión y por IP si no, respetando `X-Forwarded-For`. El parámetro `period` va **en segundos**: `limiter.py` lo usa tanto para `now - period` como para `expire(key, period)`, así que los minutos del `.env` hay que multiplicarlos. Con el valor actual (`RESET_PASSWORD_RATE_LIMIT_MINUTES=1`) queda en 3 solicitudes por minuto.

`POST /api/v1/reset-password/`

- Body: `{ "token": str, "new_password": str, "new_password_confirm": str }`
- `200` con `{"message": "Contraseña actualizada. Ya puedes iniciar sesión."}`
- `400` si el token no existe, venció o ya se usó. Un solo mensaje para los tres casos: `"El enlace no es válido o ya expiró. Solicita uno nuevo."`
- `400` si las dos contraseñas no coinciden, con el mismo texto que ya usa el registro: `"Las contraseñas no coinciden."`
- `422` si la contraseña nueva no cumple la política.

`PATCH /api/v1/me/password/`

- Depende de `get_current_user`.
- Body: `{ "current_password": str, "new_password": str, "new_password_confirm": str }`
- `200` con `{"message": "Contraseña actualizada."}`
- `400` si la contraseña actual no es correcta, si no coinciden las nuevas, o si la nueva es igual a la actual.
- `422` si no cumple la política.

**Configuración del limitador.** Dos huecos que hay que cerrar para que el límite sea usable y las pruebas deterministas:

- `RESET_PASSWORD_RATE_LIMIT_MINUTES` existe en `src/.env` y en `src/.env.example`, pero no está declarado en `RateLimitSettings` de `config.py`, así que hoy no se puede leer desde `settings`. Se agrega.
- `RATE_LIMITING_ENABLED` está declarado en `config.py:92` y no se usa en ningún archivo del repo. La bandera no hace nada. La dependencia `rate_limit` pasa a respetarla y devolver sin limitar cuando está en `false`, que es lo que la hace apagable en pruebas.

**Proveedor de correo.** `core/email/setup.py:11` pasa a `settings.ENVIRONMENT == EnvironmentOption.PRODUCTION`. Es el idioma que ya usan `core/setup.py` y `core/logging/logger.py` en esta misma rama. Sin este cambio el correo de reset no sale en producción y la funcionalidad no existe fuera de una máquina de desarrollo.

### Frontend

**Páginas nuevas.**

- `src/app/forgot-password/page.tsx` — pide el correo. Tras enviar, muestra el mensaje neutro del backend y **no** revela si la cuenta existe.
- `src/app/reset-password/page.tsx` — lee `?token=` con `useSearchParams` dentro de `Suspense`, siguiendo `app/verify-email/page.tsx`. Sin token en la URL, muestra el error sin llamar a la API.

**Componentes nuevos** en `src/app/ui/auth/`: `forgot-password-form.tsx` y `reset-password-form.tsx`.

**Lenguaje visual.** Se copia de `ui/login/login-form.tsx`: contenedor `pt-16`, `sm:max-w-md`, `p-6 sm:p-8`; inputs `bg-gray-50 border border-gray-300 rounded-lg p-2.5`; botón `bg-blue-950 rounded-full text-lg px-5 py-1.5`; errores en `text-red-500 text-sm`. El formulario de reset muestra las seis reglas de contraseña en vivo, reusando el patrón de indicadores de `client-register-form.tsx:383`.

**Cambios en archivos existentes.**

- `src/app/ui/dashboard/config/changePassword.tsx` — reemplazar el `console.log` de la línea 34 por la llamada a `PATCH /api/v1/me/password/`.
- `src/hooks/useAuth.ts` — agregar `/reset-password` a `PUBLIC_PATHS`. `/forgot-password` ya está en la línea 19.
- Eliminar `src/app/ui/auth/forgotPassword.tsx`. Es código muerto de Vite y dejarlo invita a que alguien lo use por error.

**Errores.** Los tres formularios usan `apiClient`, así que heredan el `parseErrorDetail` de `src/lib/apiError.ts`: los 422 de Pydantic llegan con los `msg` unidos y el usuario ve qué regla falló. No hace falta manejo de errores propio en cada formulario.

## Flujo de datos

```
Olvidé mi contraseña
  /forgot-password  --POST {email}-->  /api/v1/forgot-password/
                                          |
                                          +-- usuario existe? --> crea token, encola correo
                                          |
                                          +-- siempre --> 200 mensaje neutro

  correo: {FRONTEND_URL}/reset-password?token=<64 bytes urlsafe>

  /reset-password?token=X  --POST {token, new_password, new_password_confirm}-->
      /api/v1/reset-password/  -->  valida y consume token, hashea, marca used_at
                               -->  200  -->  el front redirige a /login

Cambio autenticado
  /dashboard/settings/change-password  --PATCH {current, new, confirm}-->
      /api/v1/me/password/  -->  verifica la actual, hashea, guarda
```

## Pruebas

Cada endpoint y cada regla se escriben con la prueba que falla primero.

**Backend**, con `pytest`. `pytest.ini`, `tests/conftest.py` y la estructura de `tests/unit/` ya vienen en la rama base.

- `tests/unit/api/v1/auth/test_password_policy.py` — una prueba por regla, más los casos límite: exactamente 8 caracteres se acepta y 7 se rechaza; las cuatro contraseñas de la lista negra se rechazan; y `Password1!` **se acepta**, porque la lista negra es de coincidencia exacta (`^(123456|password|qwerty|abc123)$`) y no de subcadena. Este último caso documenta el límite de la regla para que nadie la endurezca por accidente.
- `tests/unit/api/v1/auth/test_password_reset.py` — token válido, vencido, ya usado, inexistente; que crear un token nuevo invalide el anterior; que `forgot-password` devuelva 200 idéntico con correo existente y con correo inexistente; que con correo inexistente **no** se encole ningún envío.
- `tests/unit/api/v1/auth/test_change_password.py` — contraseña actual incorrecta, nueva igual a la actual, nuevas que no coinciden, camino feliz.

**Frontend**, con `node:test` vía `npm test`. Nuevo `scripts/password-reset.test.mjs`, siguiendo `scripts/api-errors.test.mjs`:

- Las seis reglas del validador de cliente, para que no se desincronicen de las del servidor.
- Integración contra el backend local: `forgot-password` con correo inexistente devuelve 200 y el mensaje neutro; `reset-password` con token basura devuelve 400 y el `detail` del backend llega parseado.

**Verificación manual**, con Mailhog en `localhost:8025`: pedir el reset, abrir el correo, seguir el enlace, cambiar la contraseña, iniciar sesión con la nueva y confirmar que la vieja ya no sirve.

## Fuera de alcance

- Cerrar sesión en todos los dispositivos al cambiar la contraseña.
- Historial de contraseñas para impedir reutilizar las últimas N.
- Segundo factor en el reset.
- Los endpoints de OAuth (`/auth/google`, `/auth/facebook`) que el login enlaza y que devuelven 404. Es un trabajo aparte.
- Los tres bugs de `deploy-beta` que bloquean la imagen de producción: el typo `alemic` en `entrypoints/web-entrypoint.sh`, las rutas `/app/scripts/` del `Dockerfile` que apuntan a un directorio que no existe, y `settings.FILE_LOG_INCLUDE_*` en `core/logging/logger.py`, que en `config.py` se llaman `BETTERSTACK_INCLUDE_*`. Ninguno afecta el entorno de desarrollo ni esta funcionalidad, pero hay que arreglarlos antes de desplegar.

## Acción pendiente de David

Crear la plantilla `PASSWORD_RESET` en Brevo y agregar su id a `BREVO_TEMPLATES` en `src/.env`. Sin eso el correo funciona en desarrollo contra Mailhog pero falla en producción, porque `brevo_provider.py:16` lanza `ValueError` cuando no encuentra el id.
