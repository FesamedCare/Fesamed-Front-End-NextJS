# Gestión de contraseñas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un usuario pueda recuperar su contraseña por correo y cambiarla desde el dashboard.

**Architecture:** Token aleatorio de un solo uso guardado en una tabla nueva `password_reset_token`, clonando el flujo de verificación de correo que ya existe. Tres endpoints en `auth/router.py`, una política de contraseña compartida en un módulo puro, y dos páginas nuevas en el front que reusan el lenguaje visual del login.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, Pydantic v2, pytest + pytest-asyncio, Next.js 15 App Router, Tailwind, `node:test`.

**Spec:** `docs/superpowers/specs/2026-07-29-recuperacion-contrasena-design.md`

## Global Constraints

- **Rama base del backend:** rama nueva desde `origin/deploy-beta`. NO desde `feat/admin-module`, que no tiene `core/rate_limit/` ni `pytest`.
- **Rama base del frontend:** `feat/admin` (la actual).
- **Todos los mensajes al usuario van en español.** Los `detail` de las excepciones se muestran tal cual en pantalla.
- **Toda contraseña nueva pasa por `validate_password_policy`.** Nunca duplicar las reglas.
- **`period` del rate limiter va en segundos.** `RESET_PASSWORD_RATE_LIMIT_MINUTES` está en minutos: multiplicar por 60.
- **Excepciones:** `BadRequestException` y `NotFoundException` viven en `src/app/api/v1/users/exceptions.py`. `UnauthorizedException` en `src/app/api/v1/auth/exceptions.py`.
- **Tests del backend:** unitarios con `AsyncMock(spec=AsyncSession)`, como en `tests/conftest.py`. No hay base de datos de pruebas. Cada test asíncrono necesita `@pytest.mark.asyncio` porque `pytest.ini` no define `asyncio_mode`.
- **Comandos del backend** se corren dentro del contenedor: `docker exec -w /app web <comando>`.
- **No agregar dependencias nuevas** a `requirements.txt` ni a `package.json`.

---

### Task 1: Preparar rama y entorno

Sin esto nada arranca: `config.py` en `deploy-beta` declara dos variables sin valor por defecto y `Settings()` lanza excepción al importar si faltan.

**Files:**
- Modify: `FesamedCare-Backend-v2/src/.env`

**Interfaces:**
- Consumes: nada.
- Produces: rama `feat/password-management` con la app arrancando y `pytest` en verde.

- [ ] **Step 1: Crear la rama desde deploy-beta**

```bash
cd FesamedCare-Backend-v2
git fetch --prune git@github.com:FesamedCare/FesamedCare-Backend-v2.git '+refs/heads/*:refs/remotes/origin/*'
git switch -c feat/password-management origin/deploy-beta
```

`git fetch` por HTTPS falla: el repo no tiene credenciales guardadas. Por SSH sí funciona.

- [ ] **Step 2: Agregar las variables que faltan a `src/.env`**

Agregar al final del archivo:

```
BETTERSTACK_SOURCE_TOKEN=dev-token-local
BETTERSTACK_LOG_LEVEL=INFO
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_LASTNAME=Fesamed
DEFAULT_ADMIN_PHONENUMBER=+573000000001
DEFAULT_ADMIN_EMAIL=admin@fesamedcare.com
DEFAULT_ADMIN_PASSWORD=CambiaEsto2026!
```

El token de Better Stack puede ser cualquier cosa en local: `logger.py` solo engancha ese handler cuando `ENVIRONMENT` es `production`.

Dejar `ADMIN_EMAIL` y `ADMIN_PASSWORD` como están. Ya no se leen, pero borrarlas no aporta nada y arriesga romper algo no encontrado.

- [ ] **Step 3: Reconstruir y levantar**

```bash
docker compose down
docker compose up -d --build
```

`deploy-beta` agrega `structlog`, `logtail-python`, `celery-redbeat`, `pytest`, `pytest-asyncio` y `tenacity` a `requirements.txt`, y cambia el servicio `web` a `Dockerfile.dev`.

- [ ] **Step 4: Verificar que la app arrancó**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/docs
docker logs web --tail 20
```

Expected: `200`, y en los logs `Application startup complete` sin traceback.

Si aparece `pydantic_core._pydantic_core.ValidationError` mencionando `BETTERSTACK_`, falta el Step 2.

- [ ] **Step 5: Verificar que no hay migraciones pendientes**

```bash
docker exec -w /app web alembic -c src/alembic.ini current
docker exec -w /app web alembic -c src/alembic.ini heads
```

Expected: los dos imprimen `d5d750c9437f`. No hay migraciones nuevas entre `feat/admin-module` y `deploy-beta`, así que la base actual sirve tal cual.

- [ ] **Step 6: Verificar que la suite existente pasa**

```bash
docker exec -w /app web pytest -q
```

Expected: todo verde. Si algo falla acá, es previo a este trabajo: anotarlo y seguir, no arreglarlo en esta tarea.

- [ ] **Step 7: Commit**

```bash
git add src/.env.example
git commit -m "chore: rama de trabajo para gestión de contraseñas"
```

`src/.env` está en `.gitignore`, así que no entra al commit. Si `.env.example` no cambió, hacer `git commit --allow-empty -m "chore: rama de trabajo para gestión de contraseñas"` para marcar el punto de partida.

---

### Task 2: Política de contraseña

Módulo puro, sin base de datos, para que `schemas.py` lo importe sin arrastrar dependencias.

**Files:**
- Create: `src/app/api/v1/auth/password_policy.py`
- Test: `tests/unit/api/v1/auth/test_password_policy.py`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `validate_password_policy(value: str) -> str` — devuelve el valor si cumple, lanza `ValueError` con mensaje en español si no.
  - `Password` — alias `Annotated[str, AfterValidator(validate_password_policy)]` para usar en los schemas de Pydantic.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_password_policy.py`:

```python
import pytest

from src.app.api.v1.auth.password_policy import validate_password_policy


VALIDA = "Fesamed2026!"


def test_acepta_una_contrasena_valida():
    assert validate_password_policy(VALIDA) == VALIDA


def test_acepta_exactamente_ocho_caracteres():
    assert validate_password_policy("Abcdef1!") == "Abcdef1!"


def test_rechaza_siete_caracteres():
    with pytest.raises(ValueError, match="al menos 8 caracteres"):
        validate_password_policy("Abcde1!")


def test_rechaza_sin_mayuscula():
    with pytest.raises(ValueError, match="mayúscula"):
        validate_password_policy("fesamed2026!")


def test_rechaza_sin_minuscula():
    with pytest.raises(ValueError, match="minúscula"):
        validate_password_policy("FESAMED2026!")


def test_rechaza_sin_numero():
    with pytest.raises(ValueError, match="número"):
        validate_password_policy("FesamedCare!")


def test_rechaza_sin_caracter_especial():
    with pytest.raises(ValueError, match="carácter especial"):
        validate_password_policy("Fesamed2026")


@pytest.mark.parametrize("trivial", ["123456", "password", "qwerty", "abc123", "PASSWORD", "QwErTy"])
def test_rechaza_contrasenas_triviales(trivial):
    with pytest.raises(ValueError, match="demasiado común"):
        validate_password_policy(trivial)


def test_la_lista_negra_es_coincidencia_exacta():
    """`Password1!` contiene "assword" pero no está en la lista negra.

    La lista está anclada con ^...$ a propósito. Este test documenta ese límite
    para que nadie la convierta en búsqueda de subcadena sin pensarlo.
    """
    assert validate_password_policy("Password1!") == "Password1!"
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_password_policy.py -q`

Expected: FAIL con `ModuleNotFoundError: No module named 'src.app.api.v1.auth.password_policy'`

- [ ] **Step 3: Escribir la implementación mínima**

Crear `src/app/api/v1/auth/password_policy.py`:

```python
"""Política de contraseñas, compartida por registro, reset y cambio.

Módulo puro a propósito: no importa nada de base de datos, para que los schemas
de Pydantic lo puedan usar sin ciclos de importación.

Las reglas replican exactamente las del frontend en
`src/app/ui/register/client-register-form.tsx:63-70`. Si cambian acá, hay que
cambiarlas allá.
"""

import re
from typing import Annotated

from pydantic import AfterValidator

MIN_LENGTH = 8

_TRIVIALES = re.compile(r"^(123456|password|qwerty|abc123)$", re.IGNORECASE)
_MAYUSCULA = re.compile(r"[A-Z]")
_MINUSCULA = re.compile(r"[a-z]")
_NUMERO = re.compile(r"[0-9]")
_ESPECIAL = re.compile(r"[!@#$%^&*(),.?\":{}|<>]")


def validate_password_policy(value: str) -> str:
    """Valida una contraseña en claro contra las seis reglas del producto.

    La lista negra se evalúa primero: si no, `password` fallaría por "falta una
    mayúscula", que es un mensaje peor y deja la regla inalcanzable.

    :param value: la contraseña en claro
    :return: el mismo valor, si cumple
    :raises ValueError: con un mensaje en español, apto para mostrar al usuario
    """
    if _TRIVIALES.match(value):
        raise ValueError("Esa contraseña es demasiado común. Elige otra.")

    if len(value) < MIN_LENGTH:
        raise ValueError(f"La contraseña debe tener al menos {MIN_LENGTH} caracteres.")

    if not _MAYUSCULA.search(value):
        raise ValueError("La contraseña debe incluir al menos una mayúscula.")

    if not _MINUSCULA.search(value):
        raise ValueError("La contraseña debe incluir al menos una minúscula.")

    if not _NUMERO.search(value):
        raise ValueError("La contraseña debe incluir al menos un número.")

    if not _ESPECIAL.search(value):
        raise ValueError("La contraseña debe incluir al menos un carácter especial.")

    return value


Password = Annotated[str, AfterValidator(validate_password_policy)]
"""Tipo para los schemas: valida la política al construir el modelo."""
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_password_policy.py -q`

Expected: `14 passed`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/v1/auth/password_policy.py tests/unit/api/v1/auth/test_password_policy.py
git commit -m "feat: política de contraseña compartida"
```

---

### Task 3: Modelo y migración de `password_reset_token`

**Files:**
- Modify: `src/app/api/v1/auth/models.py` (agregar al final, junto a `TokenBlacklist`)
- Create: `src/migrations/versions/<hash>_password_reset_token.py` (autogenerado)

**Interfaces:**
- Consumes: `Base` de `src.app.core.db.database`.
- Produces: `PasswordResetToken` con campos `user_id: UUID`, `token: str`, `expires_at: datetime`, `used_at: datetime | None`, `id: UUID`.

Va en `auth/models.py` y no en `users/models.py` (donde vive `EmailVerificationToken`) porque los endpoints que lo usan viven en `auth/router.py`, junto a `TokenBlacklist`, que es el otro modelo de ciclo de vida de tokens.

A diferencia de `EmailVerificationToken`, este modelo **no** declara `relationship` con `User`. Eso evitaría tener que agregar la colección inversa en `User`, y el CRUD trae el usuario con un `select` explícito. Menos superficie tocada.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_password_reset_model.py`:

```python
import datetime
import uuid

from src.app.api.v1.auth.models import PasswordResetToken


def test_el_modelo_apunta_a_la_tabla_correcta():
    assert PasswordResetToken.__tablename__ == "password_reset_token"


def test_se_puede_construir_con_los_campos_esperados():
    token = PasswordResetToken(
        user_id=uuid.uuid4(),
        token="x" * 86,
        expires_at=datetime.datetime.now(datetime.timezone.utc),
        used_at=None,
    )

    assert token.used_at is None
    assert token.id is not None


def test_las_columnas_declaradas_son_las_esperadas():
    columnas = set(PasswordResetToken.__table__.columns.keys())
    assert columnas == {"id", "user_id", "token", "expires_at", "used_at"}
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_password_reset_model.py -q`

Expected: FAIL con `ImportError: cannot import name 'PasswordResetToken'`

- [ ] **Step 3: Agregar el modelo**

Al final de `src/app/api/v1/auth/models.py`:

```python
class PasswordResetToken(Base):
    __tablename__ = 'password_reset_token'

    # Attributes
    user_id: Mapped[uuid_pkg.UUID] = mapped_column(ForeignKey("user.id"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    id: Mapped[uuid_pkg.UUID] = mapped_column("id", default_factory=uuid_pkg.uuid4, server_default=text('gen_random_uuid()'), nullable=False, unique=True, primary_key=True)
```

Todos los nombres importados (`uuid_pkg`, `datetime`, `ForeignKey`, `String`, `DateTime`, `text`, `Mapped`, `mapped_column`, `Base`) ya están en la cabecera del archivo. No hay que agregar imports.

`used_at` se declara `datetime | None` sin default, igual que en `EmailVerificationToken`, así que el constructor lo exige explícitamente.

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_password_reset_model.py -q`

Expected: `3 passed`

- [ ] **Step 5: Generar la migración**

```bash
docker exec -w /app web alembic -c src/alembic.ini revision --autogenerate -m "password_reset_token table"
```

- [ ] **Step 6: Revisar la migración generada**

```bash
docker exec -w /app web sh -c 'ls -t src/migrations/versions/*.py | head -1 | xargs cat'
```

El `upgrade()` debe contener exactamente una `create_table` para `password_reset_token`, con la FK a `user.id`, el índice en `user_id` y el unique en `token`. Si trae cualquier otra operación (drops, alters de tablas ajenas), el autogenerate detectó deriva previa entre modelos y base: borrar el archivo, avisar, y no seguir.

- [ ] **Step 7: Aplicar la migración**

```bash
docker exec -w /app web alembic -c src/alembic.ini upgrade head
docker exec database psql -U postgres -d 'FESAMED-DB' -tAc "select column_name from information_schema.columns where table_name='password_reset_token' order by column_name;"
```

Expected: `expires_at`, `id`, `token`, `used_at`, `user_id`

- [ ] **Step 8: Commit**

```bash
git add src/app/api/v1/auth/models.py src/migrations/versions/ tests/unit/api/v1/auth/test_password_reset_model.py
git commit -m "feat: modelo y migración de password_reset_token"
```

---

### Task 4: CRUD del token de reset

**Files:**
- Create: `src/app/crud/crud_password_reset_token.py`
- Test: `tests/unit/api/v1/auth/test_crud_password_reset_token.py`

**Interfaces:**
- Consumes: `PasswordResetToken` de Task 3.
- Produces:
  - `async create_reset_token(user_id: UUID, db: AsyncSession, expires_in_minutes: int) -> str`
  - `async consume_reset_token(token: str, db: AsyncSession) -> Optional[User]` — **no hace commit**, el router commitea.
  - `async invalidate_user_reset_tokens(user_id: UUID, db: AsyncSession) -> None`

`consume_reset_token` se aparta de `crud_email_verification_token.verify_token`, que sí commitea. Acá el commit lo hace el router para que quemar el token y guardar la contraseña nueva ocurran en la misma transacción: si el hasheo falla, el enlace sigue sirviendo.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_crud_password_reset_token.py`:

```python
import datetime
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.app.crud.crud_password_reset_token import (
    consume_reset_token,
    create_reset_token,
)


@pytest.mark.asyncio
async def test_create_reset_token_devuelve_un_token_urlsafe(get_async_db_mock):
    token = await create_reset_token(uuid.uuid4(), get_async_db_mock, 20)

    assert isinstance(token, str)
    assert len(token) >= 64
    assert " " not in token


@pytest.mark.asyncio
async def test_create_reset_token_persiste_y_commitea(get_async_db_mock):
    await create_reset_token(uuid.uuid4(), get_async_db_mock, 20)

    get_async_db_mock.add.assert_called_once()
    get_async_db_mock.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_reset_token_invalida_los_previos(get_async_db_mock, monkeypatch):
    invalidar = AsyncMock()
    monkeypatch.setattr(
        "src.app.crud.crud_password_reset_token.invalidate_user_reset_tokens", invalidar
    )
    user_id = uuid.uuid4()

    await create_reset_token(user_id, get_async_db_mock, 20)

    invalidar.assert_awaited_once_with(user_id, get_async_db_mock)


@pytest.mark.asyncio
async def test_invalidate_user_reset_tokens_marca_los_vigentes(get_async_db_mock):
    from src.app.crud.crud_password_reset_token import invalidate_user_reset_tokens

    await invalidate_user_reset_tokens(uuid.uuid4(), get_async_db_mock)

    get_async_db_mock.execute.assert_awaited_once()
    sentencia = str(get_async_db_mock.execute.await_args.args[0])
    assert "UPDATE password_reset_token" in sentencia
    assert "used_at" in sentencia


@pytest.mark.asyncio
async def test_create_reset_token_calcula_la_expiracion(get_async_db_mock):
    antes = datetime.datetime.now(datetime.timezone.utc)

    await create_reset_token(uuid.uuid4(), get_async_db_mock, 20)

    guardado = get_async_db_mock.add.call_args.args[0]
    delta = guardado.expires_at - antes
    assert datetime.timedelta(minutes=19) < delta < datetime.timedelta(minutes=21)


@pytest.mark.asyncio
async def test_consume_reset_token_devuelve_none_si_no_existe(get_async_db_mock):
    resultado_vacio = MagicMock()
    resultado_vacio.scalar_one_or_none.return_value = None
    get_async_db_mock.execute = AsyncMock(return_value=resultado_vacio)

    assert await consume_reset_token("no-existe", get_async_db_mock) is None


@pytest.mark.asyncio
async def test_consume_reset_token_marca_used_at_y_devuelve_el_usuario(get_async_db_mock):
    fila_token = MagicMock()
    fila_token.used_at = None
    fila_token.user_id = uuid.uuid4()

    usuario = MagicMock()

    res_token = MagicMock()
    res_token.scalar_one_or_none.return_value = fila_token
    res_user = MagicMock()
    res_user.scalar_one_or_none.return_value = usuario

    get_async_db_mock.execute = AsyncMock(side_effect=[res_token, res_user])

    devuelto = await consume_reset_token("token-bueno", get_async_db_mock)

    assert devuelto is usuario
    assert fila_token.used_at is not None
    get_async_db_mock.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_consume_reset_token_devuelve_none_si_el_usuario_no_existe(get_async_db_mock):
    fila_token = MagicMock()
    fila_token.used_at = None
    fila_token.user_id = uuid.uuid4()

    res_token = MagicMock()
    res_token.scalar_one_or_none.return_value = fila_token
    res_user = MagicMock()
    res_user.scalar_one_or_none.return_value = None

    get_async_db_mock.execute = AsyncMock(side_effect=[res_token, res_user])

    assert await consume_reset_token("token-huerfano", get_async_db_mock) is None
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_crud_password_reset_token.py -q`

Expected: FAIL con `ModuleNotFoundError: No module named 'src.app.crud.crud_password_reset_token'`

- [ ] **Step 3: Escribir la implementación**

Crear `src/app/crud/crud_password_reset_token.py`:

```python
"""CRUD del token de restablecimiento de contraseña.

Clona `crud_email_verification_token.py`, con una diferencia deliberada:
`consume_reset_token` no commitea. Lo hace el router, para que quemar el token
y guardar la contraseña nueva caigan en la misma transacción.
"""

import datetime
import secrets
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.api.v1.auth.models import PasswordResetToken, User


async def create_reset_token(user_id: UUID, db: AsyncSession, expires_in_minutes: int) -> str:
    """Crea un token de reset, invalidando los previos sin usar del mismo usuario.

    :param user_id: dueño del token
    :param db: sesión
    :param expires_in_minutes: vida del token, normalmente settings.RESET_TOKEN_EXPIRE_MINUTES
    :return: el token en claro, para armar el enlace del correo
    """
    await invalidate_user_reset_tokens(user_id, db)

    token = secrets.token_urlsafe(64)
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=expires_in_minutes
    )

    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        used_at=None,
    )

    db.add(reset_token)
    await db.commit()

    return token


async def consume_reset_token(token: str, db: AsyncSession) -> Optional[User]:
    """Valida un token y lo marca como usado, sin commitear.

    :param token: el token que llegó en el enlace
    :param db: sesión
    :return: el usuario dueño del token, o None si el token no sirve
    """
    resultado = await db.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.token == token)
        .where(PasswordResetToken.used_at.is_(None))
        .where(PasswordResetToken.expires_at > datetime.datetime.now(datetime.timezone.utc))
    )
    fila = resultado.scalar_one_or_none()

    if fila is None:
        return None

    usuario = (
        await db.execute(select(User).where(User.id == fila.user_id))
    ).scalar_one_or_none()

    if usuario is None:
        return None

    fila.used_at = datetime.datetime.now(datetime.timezone.utc)

    return usuario


async def invalidate_user_reset_tokens(user_id: UUID, db: AsyncSession) -> None:
    """Marca como usados todos los tokens vigentes del usuario.

    Así, pedir un enlace nuevo deja inservible el anterior.
    """
    await db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user_id)
        .where(PasswordResetToken.used_at.is_(None))
        .values(used_at=datetime.datetime.now(datetime.timezone.utc))
    )
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_crud_password_reset_token.py -q`

Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
git add src/app/crud/crud_password_reset_token.py tests/unit/api/v1/auth/test_crud_password_reset_token.py
git commit -m "feat: CRUD del token de reset de contraseña"
```

---

### Task 5: Arreglos de configuración

Tres huecos existentes que bloquean que el resto funcione de verdad.

**Files:**
- Modify: `src/app/core/email/setup.py:11`
- Modify: `src/app/core/config.py` (clase `RateLimitSettings`, línea 91)
- Modify: `src/app/core/rate_limit/dependencies.py` (función `rate_limit`)
- Test: `tests/unit/core/test_email_provider_selection.py`
- Test: `tests/unit/core/test_rate_limit_toggle.py`

**Interfaces:**
- Consumes: nada de las tareas anteriores.
- Produces: `settings.RESET_PASSWORD_RATE_LIMIT_MINUTES: int`, y `rate_limit` respetando `settings.RATE_LIMITING_ENABLED`.

- [ ] **Step 1: Crear los `__init__.py` que faltan**

```bash
docker exec -w /app web sh -c 'mkdir -p tests/unit/core && touch tests/unit/core/__init__.py'
```

- [ ] **Step 2: Escribir los tests que fallan**

Crear `tests/unit/core/test_email_provider_selection.py`:

```python
"""El selector de proveedor comparaba con el string 'prod'.

`EnvironmentOption` es un Enum plano, no `str, Enum`, así que esa comparación
era False siempre y Brevo nunca se usaba. Con MAIL_SERVER=mailhog en producción,
eso significa que ningún correo salía.
"""

import pytest

from src.app.core.config import EnvironmentOption
from src.app.core.email.providers.brevo_provider import BrevoProvider
from src.app.core.email.providers.smtp_provider import SMTPProvider
from src.app.core.email.setup import get_email_provider


@pytest.fixture
def restaurar_environment():
    from src.app.core import config

    original = config.settings.ENVIRONMENT
    yield
    config.settings.ENVIRONMENT = original


def test_en_produccion_usa_brevo(restaurar_environment):
    from src.app.core import config

    config.settings.ENVIRONMENT = EnvironmentOption.PRODUCTION

    assert isinstance(get_email_provider(), BrevoProvider)


def test_en_local_usa_smtp(restaurar_environment):
    from src.app.core import config

    config.settings.ENVIRONMENT = EnvironmentOption.LOCAL

    assert isinstance(get_email_provider(), SMTPProvider)


def test_en_staging_usa_smtp(restaurar_environment):
    from src.app.core import config

    config.settings.ENVIRONMENT = EnvironmentOption.STAGING

    assert isinstance(get_email_provider(), SMTPProvider)
```

Crear `tests/unit/core/test_rate_limit_toggle.py`:

```python
"""RATE_LIMITING_ENABLED estaba declarado en config.py y no se usaba en ningún
archivo del repo. La bandera no hacía nada. Estos tests la vuelven real.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.app.core.rate_limit.dependencies import rate_limit


@pytest.fixture
def restaurar_bandera():
    from src.app.core import config

    original = config.settings.RATE_LIMITING_ENABLED
    yield
    config.settings.RATE_LIMITING_ENABLED = original


@pytest.fixture
def request_falso():
    peticion = MagicMock()
    peticion.headers = {}
    peticion.client.host = "10.0.0.1"
    peticion.url.path = "/api/v1/forgot-password/"
    return peticion


@pytest.mark.asyncio
async def test_con_la_bandera_apagada_no_consulta_redis(
    restaurar_bandera, request_falso, monkeypatch
):
    from src.app.core import config

    config.settings.RATE_LIMITING_ENABLED = False

    consultar = AsyncMock(return_value=False)
    monkeypatch.setattr(
        "src.app.core.rate_limit.dependencies.rate_limiter.is_rate_limited", consultar
    )

    dependencia = rate_limit(limit=1, period=60)
    await dependencia(request=request_falso, current_user=None)

    consultar.assert_not_awaited()


@pytest.mark.asyncio
async def test_con_la_bandera_encendida_si_consulta_redis(
    restaurar_bandera, request_falso, monkeypatch
):
    from src.app.core import config

    config.settings.RATE_LIMITING_ENABLED = True

    consultar = AsyncMock(return_value=False)
    monkeypatch.setattr(
        "src.app.core.rate_limit.dependencies.rate_limiter.is_rate_limited", consultar
    )

    dependencia = rate_limit(limit=1, period=60)
    await dependencia(request=request_falso, current_user=None)

    consultar.assert_awaited_once()
    assert consultar.await_args.kwargs["identifier"] == "10.0.0.1"
    assert consultar.await_args.kwargs["limit"] == 1
    assert consultar.await_args.kwargs["period"] == 60


@pytest.mark.asyncio
async def test_bloquea_con_429_cuando_se_pasa_del_limite(
    restaurar_bandera, request_falso, monkeypatch
):
    from fastapi import HTTPException

    from src.app.core import config

    config.settings.RATE_LIMITING_ENABLED = True

    monkeypatch.setattr(
        "src.app.core.rate_limit.dependencies.rate_limiter.is_rate_limited",
        AsyncMock(return_value=True),
    )

    dependencia = rate_limit(limit=1, period=60)

    with pytest.raises(HTTPException) as exc:
        await dependencia(request=request_falso, current_user=None)

    assert exc.value.status_code == 429


@pytest.mark.asyncio
async def test_el_periodo_de_reset_sale_de_la_config():
    from src.app.core.config import settings

    assert isinstance(settings.RESET_PASSWORD_RATE_LIMIT_MINUTES, int)
    assert settings.RESET_PASSWORD_RATE_LIMIT_MINUTES >= 1
```

`test_con_la_bandera_encendida_si_evalua` espera `AttributeError` porque con `request=None` la función intenta `request.headers` y falla. Es una forma barata de comprobar que sí entra a evaluar en vez de salir temprano.

- [ ] **Step 3: Correr los tests para verificar que fallan**

Run: `docker exec -w /app web pytest tests/unit/core -q`

Expected: FAIL. `test_en_produccion_usa_brevo` falla porque devuelve `SMTPProvider`. `test_el_periodo_de_reset_sale_de_la_config` falla con `AttributeError: 'Settings' object has no attribute 'RESET_PASSWORD_RATE_LIMIT_MINUTES'`.

- [ ] **Step 4: Arreglar el selector de proveedor**

En `src/app/core/email/setup.py`, cambiar el import y la comparación:

```python
from src.app.core.config import settings, EnvironmentOption
```

y la línea 11:

```python
    if settings.ENVIRONMENT == EnvironmentOption.PRODUCTION:
```

Es el mismo idioma que ya usan `core/setup.py:88` y `core/logging/logger.py`.

- [ ] **Step 5: Declarar el minutaje del rate limit**

En `src/app/core/config.py`, en la clase `RateLimitSettings`:

```python
class RateLimitSettings(BaseSettings):
    RATE_LIMITING_ENABLED: bool = config("RATE_LIMITING_ENABLED")
    RESET_PASSWORD_RATE_LIMIT_MINUTES: int = config("RESET_PASSWORD_RATE_LIMIT_MINUTES", default=1)
```

La variable ya existe en `src/.env` y en `src/.env.example` con valor `1`. Solo faltaba declararla.

- [ ] **Step 6: Hacer que la bandera signifique algo**

En `src/app/core/rate_limit/dependencies.py`, agregar el import de settings:

```python
from src.app.core.config import settings
```

y al inicio del cuerpo de `dependency`, antes de calcular el identificador:

```python
    async def dependency(
        request: Request,
        current_user: Optional[User] = Depends(get_current_user_optional)
    ):
        if not settings.RATE_LIMITING_ENABLED:
            return

        identifier = str(current_user.id) if current_user else get_client_ip(request)
```

- [ ] **Step 7: Correr los tests para verificar que pasan**

Run: `docker exec -w /app web pytest tests/unit/core -q`

Expected: `6 passed`

- [ ] **Step 8: Verificar que no se rompió nada**

Run: `docker exec -w /app web pytest -q`

Expected: todo verde, incluido lo de las Tasks 2 a 4.

- [ ] **Step 9: Commit**

```bash
git add src/app/core/email/setup.py src/app/core/config.py src/app/core/rate_limit/dependencies.py tests/unit/core/
git commit -m "fix: selector de proveedor de correo y bandera de rate limiting"
```

---

### Task 6: `POST /api/v1/forgot-password/`

**Files:**
- Modify: `src/app/api/v1/auth/schemas.py`
- Modify: `src/app/api/v1/auth/router.py`
- Test: `tests/unit/api/v1/auth/test_forgot_password.py`

**Interfaces:**
- Consumes: `create_reset_token` (Task 4), `settings.RESET_PASSWORD_RATE_LIMIT_MINUTES` (Task 5).
- Produces: `ForgotPasswordRequest(email: EmailStr)`, y la constante `MENSAJE_NEUTRO`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_forgot_password.py`:

```python
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.app.api.v1.auth.router import MENSAJE_NEUTRO, forgot_password
from src.app.api.v1.auth.schemas import ForgotPasswordRequest


def _db_con_usuario(usuario):
    db = AsyncMock()
    resultado = MagicMock()
    resultado.scalar_one_or_none.return_value = usuario
    db.execute = AsyncMock(return_value=resultado)
    return db


def _usuario_falso():
    usuario = MagicMock()
    usuario.id = uuid.uuid4()
    usuario.email = "paciente@example.com"
    usuario.name = "Ana"
    usuario.lastname = "Ruiz"
    return usuario


@pytest.mark.asyncio
async def test_con_correo_inexistente_responde_el_mensaje_neutro():
    db = _db_con_usuario(None)
    tareas = MagicMock()

    respuesta = await forgot_password(
        data=ForgotPasswordRequest(email="nadie@example.com"),
        background_tasks=tareas,
        db=db,
    )

    assert respuesta == MENSAJE_NEUTRO


@pytest.mark.asyncio
async def test_con_correo_inexistente_no_encola_ningun_envio():
    db = _db_con_usuario(None)
    tareas = MagicMock()

    await forgot_password(
        data=ForgotPasswordRequest(email="nadie@example.com"),
        background_tasks=tareas,
        db=db,
    )

    tareas.add_task.assert_not_called()


@pytest.mark.asyncio
async def test_con_correo_existente_responde_lo_mismo(monkeypatch):
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.create_reset_token",
        AsyncMock(return_value="token-generado"),
    )
    db = _db_con_usuario(_usuario_falso())
    tareas = MagicMock()

    respuesta = await forgot_password(
        data=ForgotPasswordRequest(email="paciente@example.com"),
        background_tasks=tareas,
        db=db,
    )

    assert respuesta == MENSAJE_NEUTRO


@pytest.mark.asyncio
async def test_con_correo_existente_encola_el_enlace_correcto(monkeypatch):
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.create_reset_token",
        AsyncMock(return_value="token-generado"),
    )
    db = _db_con_usuario(_usuario_falso())
    tareas = MagicMock()

    await forgot_password(
        data=ForgotPasswordRequest(email="paciente@example.com"),
        background_tasks=tareas,
        db=db,
    )

    tareas.add_task.assert_called_once()
    params = tareas.add_task.call_args.args[-1]
    assert params["reset_url"].endswith("/reset-password?token=token-generado")
    assert params["user_name"] == "Ana Ruiz"


def test_el_mensaje_neutro_no_revela_si_la_cuenta_existe():
    texto = MENSAJE_NEUTRO["message"].lower()
    for palabra in ("no existe", "no encontr", "no está registrado"):
        assert palabra not in texto
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_forgot_password.py -q`

Expected: FAIL con `ImportError: cannot import name 'MENSAJE_NEUTRO'`

- [ ] **Step 3: Agregar el schema**

Al final de `src/app/api/v1/auth/schemas.py`:

```python
class ForgotPasswordRequest(BaseModel):
    email: EmailStr
```

- [ ] **Step 4: Agregar el endpoint**

En `src/app/api/v1/auth/router.py`, agregar a los imports:

```python
from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy import select

from src.app.api.v1.auth.schemas import ForgotPasswordRequest
from src.app.core.email.providers.base import EmailTemplate
from src.app.core.email.setup import get_email_provider
from src.app.crud.crud_password_reset_token import create_reset_token
```

La línea `from fastapi import APIRouter, Depends` que ya existe se reemplaza por la de arriba.

Y el endpoint, al final del archivo:

```python
MENSAJE_NEUTRO = {
    "message": "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."
}
"""Respuesta única de /forgot-password/.

Se devuelve exista el usuario o no, a propósito: confirmar qué correos tienen
cuenta en una plataforma médica ya es filtrar información sobre esa persona.
"""


@router.post(
    '/forgot-password/',
    dependencies=[Depends(rate_limit(limit=3, period=settings.RESET_PASSWORD_RATE_LIMIT_MINUTES * 60))]
)
async def forgot_password(
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(async_get_db)
):
    usuario = (
        await db.execute(select(User).where(User.email == data.email))
    ).scalar_one_or_none()

    if usuario is None:
        return MENSAJE_NEUTRO

    token = await create_reset_token(usuario.id, db, settings.RESET_TOKEN_EXPIRE_MINUTES)

    nombre = f"{usuario.name} {usuario.lastname}"
    provider = get_email_provider()

    background_tasks.add_task(
        provider.send_async,
        usuario.email,
        nombre,
        EmailTemplate.PASSWORD_RESET,
        {
            "user_name": nombre,
            "reset_url": f"{settings.FRONTEND_URL}/reset-password?token={token}",
        },
    )

    return MENSAJE_NEUTRO
```

`period` va en segundos: por eso el `* 60`.

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_forgot_password.py -q`

Expected: `5 passed`

- [ ] **Step 6: Verificar contra la API real**

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8000/api/v1/forgot-password/ \
  -H 'Content-Type: application/json' -d '{"email":"nadie@example.com"}'
```

Expected: `HTTP 200` con el mensaje neutro.

```bash
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8000/api/v1/forgot-password/ \
  -H 'Content-Type: application/json' -d '{"email":"garxia0710@gmail.com"}'
curl -s http://localhost:8000/../ >/dev/null 2>&1
curl -s http://localhost:8025/api/v2/messages | python3 -c "import sys,json;d=json.load(sys.stdin);print('mensajes:',d['total'])"
```

Expected: la misma respuesta 200, y el contador de Mailhog subió en 1.

Repetir la llamada cuatro veces seguidas debe devolver `HTTP 429` con `"Demasiadas solicitudes. Intenta más tarde."` en la cuarta.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/auth/schemas.py src/app/api/v1/auth/router.py tests/unit/api/v1/auth/test_forgot_password.py
git commit -m "feat: endpoint de solicitud de reset de contraseña"
```

---

### Task 7: `POST /api/v1/reset-password/`

**Files:**
- Modify: `src/app/api/v1/auth/schemas.py`
- Modify: `src/app/api/v1/auth/router.py`
- Test: `tests/unit/api/v1/auth/test_reset_password.py`

**Interfaces:**
- Consumes: `consume_reset_token` (Task 4), `Password` (Task 2).
- Produces: `ResetPasswordRequest(token: str, new_password: Password, new_password_confirm: str)`.

`new_password_confirm` se declara `str` y no `Password` a propósito: si las dos llevaran el validador, una confirmación mal escrita produciría dos errores de política en vez de un "las contraseñas no coinciden".

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_reset_password.py`:

```python
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.app.api.v1.auth.router import reset_password
from src.app.api.v1.auth.schemas import ResetPasswordRequest

VALIDA = "Fesamed2026!"


@pytest.mark.asyncio
async def test_token_invalido_devuelve_400(monkeypatch):
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.consume_reset_token",
        AsyncMock(return_value=None),
    )

    with pytest.raises(HTTPException) as exc:
        await reset_password(
            data=ResetPasswordRequest(
                token="basura", new_password=VALIDA, new_password_confirm=VALIDA
            ),
            db=AsyncMock(),
        )

    assert exc.value.status_code == 400
    assert "no es válido o ya expiró" in exc.value.detail


@pytest.mark.asyncio
async def test_contrasenas_que_no_coinciden_devuelven_400():
    with pytest.raises(HTTPException) as exc:
        await reset_password(
            data=ResetPasswordRequest(
                token="cualquiera", new_password=VALIDA, new_password_confirm="Otra2026!"
            ),
            db=AsyncMock(),
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Las contraseñas no coinciden."


@pytest.mark.asyncio
async def test_no_quema_el_token_si_las_contrasenas_no_coinciden(monkeypatch):
    consumir = AsyncMock(return_value=MagicMock())
    monkeypatch.setattr("src.app.api.v1.auth.router.consume_reset_token", consumir)

    with pytest.raises(HTTPException):
        await reset_password(
            data=ResetPasswordRequest(
                token="cualquiera", new_password=VALIDA, new_password_confirm="Otra2026!"
            ),
            db=AsyncMock(),
        )

    consumir.assert_not_awaited()


def test_una_contrasena_debil_no_construye_el_schema():
    with pytest.raises(ValidationError, match="mayúscula"):
        ResetPasswordRequest(
            token="cualquiera", new_password="fesamed2026!", new_password_confirm="fesamed2026!"
        )


@pytest.mark.asyncio
async def test_camino_feliz_guarda_el_hash_y_commitea(monkeypatch):
    usuario = MagicMock()
    usuario.password = "hash-viejo"

    monkeypatch.setattr(
        "src.app.api.v1.auth.router.consume_reset_token",
        AsyncMock(return_value=usuario),
    )
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.hash_password",
        AsyncMock(return_value="hash-nuevo"),
    )
    db = AsyncMock()

    respuesta = await reset_password(
        data=ResetPasswordRequest(
            token="token-bueno", new_password=VALIDA, new_password_confirm=VALIDA
        ),
        db=db,
    )

    assert usuario.password == "hash-nuevo"
    db.commit.assert_awaited_once()
    assert "Contraseña actualizada" in respuesta["message"]
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_reset_password.py -q`

Expected: FAIL con `ImportError: cannot import name 'reset_password'`

- [ ] **Step 3: Agregar el schema**

Al final de `src/app/api/v1/auth/schemas.py`, agregando el import arriba:

```python
from src.app.api.v1.auth.password_policy import Password
```

```python
class ResetPasswordRequest(BaseModel):
    token: str
    new_password: Password
    new_password_confirm: str
```

- [ ] **Step 4: Agregar el endpoint**

En `src/app/api/v1/auth/router.py`, agregar a los imports:

```python
from src.app.api.v1.auth.schemas import ForgotPasswordRequest, ResetPasswordRequest
from src.app.api.v1.auth.utils import hash_password
from src.app.api.v1.users.exceptions import BadRequestException
from src.app.crud.crud_password_reset_token import consume_reset_token, create_reset_token
```

Las dos líneas de import que ya existen para `ForgotPasswordRequest` y `create_reset_token` se reemplazan por estas.

Y al final del archivo:

```python
@router.post('/reset-password/')
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(async_get_db)
):
    # La confirmación se compara antes de tocar el token: un error de tecleo no
    # debe quemar el enlace y obligar a pedir otro correo.
    if data.new_password != data.new_password_confirm:
        raise BadRequestException('Las contraseñas no coinciden.')

    usuario = await consume_reset_token(data.token, db)
    if usuario is None:
        raise BadRequestException('El enlace no es válido o ya expiró. Solicita uno nuevo.')

    usuario.password = await hash_password(data.new_password)

    # Un solo commit: quemar el token y guardar la contraseña son atómicos.
    await db.commit()

    return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_reset_password.py -q`

Expected: `5 passed`

- [ ] **Step 6: Verificar el ciclo completo contra la API real**

```bash
curl -s -X POST http://localhost:8000/api/v1/forgot-password/ \
  -H 'Content-Type: application/json' -d '{"email":"garxia0710@gmail.com"}'
docker exec database psql -U postgres -d 'FESAMED-DB' -tAc \
  "select token from password_reset_token where used_at is null order by expires_at desc limit 1;"
```

Con ese token:

```bash
TOKEN=<el token de arriba>
curl -s -w "\nHTTP %{http_code}\n" -X POST http://localhost:8000/api/v1/reset-password/ \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$TOKEN\",\"new_password\":\"Fesamed2026!\",\"new_password_confirm\":\"Fesamed2026!\"}"
```

Expected: `HTTP 200`. Repetir la misma llamada da `HTTP 400` con `"El enlace no es válido o ya expiró. Solicita uno nuevo."`, que confirma el uso único.

Después, comprobar que la contraseña nueva sirve:

```bash
curl -s -o /dev/null -w "login HTTP %{http_code}\n" -X POST http://localhost:8000/api/v1/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "username=garxia0710@gmail.com" --data-urlencode "password=Fesamed2026!"
```

Expected: `HTTP 200`.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/auth/schemas.py src/app/api/v1/auth/router.py tests/unit/api/v1/auth/test_reset_password.py
git commit -m "feat: endpoint de reset de contraseña con token de un solo uso"
```

---

### Task 8: `PATCH /api/v1/me/password/`

**Files:**
- Modify: `src/app/api/v1/auth/schemas.py`
- Modify: `src/app/api/v1/auth/router.py`
- Test: `tests/unit/api/v1/auth/test_change_password.py`

**Interfaces:**
- Consumes: `Password` (Task 2), `get_current_user` (ya existe).
- Produces: `ChangePasswordRequest(current_password: str, new_password: Password, new_password_confirm: str)`.

`get_current_user` depende de `async_get_db`, la misma dependencia que el endpoint. FastAPI cachea las dependencias por request, así que el `User` que llega viene atado a la misma sesión y mutarlo más `commit()` persiste.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/auth/test_change_password.py`:

```python
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.app.api.v1.auth.router import change_my_password
from src.app.api.v1.auth.schemas import ChangePasswordRequest

ACTUAL = "Actual2026!"
NUEVA = "Fesamed2026!"


def _usuario():
    usuario = MagicMock()
    usuario.password = "hash-de-la-actual"
    return usuario


@pytest.mark.asyncio
async def test_contrasena_actual_incorrecta_devuelve_400(monkeypatch):
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.verify_password", AsyncMock(return_value=False)
    )

    with pytest.raises(HTTPException) as exc:
        await change_my_password(
            data=ChangePasswordRequest(
                current_password="loQueSea", new_password=NUEVA, new_password_confirm=NUEVA
            ),
            current_user=_usuario(),
            db=AsyncMock(),
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "La contraseña actual no es correcta."


@pytest.mark.asyncio
async def test_confirmacion_distinta_devuelve_400(monkeypatch):
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.verify_password", AsyncMock(return_value=True)
    )

    with pytest.raises(HTTPException) as exc:
        await change_my_password(
            data=ChangePasswordRequest(
                current_password=ACTUAL, new_password=NUEVA, new_password_confirm="Otra2026!"
            ),
            current_user=_usuario(),
            db=AsyncMock(),
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Las contraseñas no coinciden."


@pytest.mark.asyncio
async def test_nueva_igual_a_la_actual_devuelve_400(monkeypatch):
    # verify_password devuelve True las dos veces: la actual coincide y la nueva
    # también, o sea que el usuario mandó la misma.
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.verify_password", AsyncMock(return_value=True)
    )

    with pytest.raises(HTTPException) as exc:
        await change_my_password(
            data=ChangePasswordRequest(
                current_password=ACTUAL, new_password=ACTUAL, new_password_confirm=ACTUAL
            ),
            current_user=_usuario(),
            db=AsyncMock(),
        )

    assert exc.value.status_code == 400
    assert "distinta de la actual" in exc.value.detail


@pytest.mark.asyncio
async def test_camino_feliz_guarda_el_hash_y_commitea(monkeypatch):
    # Primera llamada: la actual coincide. Segunda: la nueva NO coincide con la
    # actual, que es lo que queremos.
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.verify_password",
        AsyncMock(side_effect=[True, False]),
    )
    monkeypatch.setattr(
        "src.app.api.v1.auth.router.hash_password", AsyncMock(return_value="hash-nuevo")
    )

    usuario = _usuario()
    db = AsyncMock()

    respuesta = await change_my_password(
        data=ChangePasswordRequest(
            current_password=ACTUAL, new_password=NUEVA, new_password_confirm=NUEVA
        ),
        current_user=usuario,
        db=db,
    )

    assert usuario.password == "hash-nuevo"
    db.commit.assert_awaited_once()
    assert respuesta == {"message": "Contraseña actualizada."}
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_change_password.py -q`

Expected: FAIL con `ImportError: cannot import name 'change_my_password'`

- [ ] **Step 3: Agregar el schema**

Al final de `src/app/api/v1/auth/schemas.py`:

```python
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: Password
    new_password_confirm: str
```

- [ ] **Step 4: Agregar el endpoint**

En `src/app/api/v1/auth/router.py`, ampliar los imports:

```python
from src.app.api.v1.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from src.app.api.v1.auth.utils import hash_password, verify_password
```

`get_current_user` ya está importado en la cabecera del archivo.

Y al final:

```python
@router.patch('/me/password/')
async def change_my_password(
    data: ChangePasswordRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(async_get_db)
):
    if not await verify_password(data.current_password, current_user.password):
        raise BadRequestException('La contraseña actual no es correcta.')

    if data.new_password != data.new_password_confirm:
        raise BadRequestException('Las contraseñas no coinciden.')

    if await verify_password(data.new_password, current_user.password):
        raise BadRequestException('La contraseña nueva debe ser distinta de la actual.')

    current_user.password = await hash_password(data.new_password)
    await db.commit()

    return {"message": "Contraseña actualizada."}
```

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/auth/test_change_password.py -q`

Expected: `4 passed`

- [ ] **Step 6: Verificar contra la API real**

```bash
cd /tmp && rm -f jar.txt
curl -s -o /dev/null -c jar.txt -X POST http://localhost:8000/api/v1/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode "username=garxia0710@gmail.com" --data-urlencode "password=Fesamed2026!"

curl -s -w "\nHTTP %{http_code}\n" -b jar.txt -X PATCH http://localhost:8000/api/v1/me/password/ \
  -H 'Content-Type: application/json' \
  -d '{"current_password":"Fesamed2026!","new_password":"Fesamed2027!","new_password_confirm":"Fesamed2027!"}'
```

Expected: `HTTP 200`. Repetirlo con la misma `current_password` da `HTTP 400` con `"La contraseña actual no es correcta."`

- [ ] **Step 7: Commit**

```bash
git add src/app/api/v1/auth/schemas.py src/app/api/v1/auth/router.py tests/unit/api/v1/auth/test_change_password.py
git commit -m "feat: cambio de contraseña autenticado"
```

---

### Task 9: Aplicar la política al registro

**Files:**
- Modify: `src/app/api/v1/users/schemas.py:30`
- Test: `tests/unit/api/v1/users/test_user_create_schema.py`

**Interfaces:**
- Consumes: `Password` (Task 2).
- Produces: nada nuevo. Cambia el comportamiento de `UserCreate`.

Va en su propia tarea porque cambia el registro, que ya funciona. Un revisor podría querer aprobar todo lo anterior y frenar esto.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/unit/api/v1/users/test_user_create_schema.py`:

```python
import uuid

import pytest
from pydantic import ValidationError

from src.app.api.v1.users.schemas import UserCreate

BASE = {
    "name": "Ana",
    "lastname": "Ruiz",
    "email": "ana@example.com",
    "phone_number": "+573001234567",
    "role_id": uuid.uuid4(),
}


def test_acepta_una_contrasena_que_cumple():
    usuario = UserCreate(**BASE, plain_password="Fesamed2026!", plain_password_confirm="Fesamed2026!")
    assert usuario.plain_password == "Fesamed2026!"


def test_rechaza_una_contrasena_corta():
    with pytest.raises(ValidationError, match="al menos 8 caracteres"):
        UserCreate(**BASE, plain_password="Ab1!", plain_password_confirm="Ab1!")


def test_rechaza_una_contrasena_sin_numero():
    with pytest.raises(ValidationError, match="número"):
        UserCreate(**BASE, plain_password="FesamedCare!", plain_password_confirm="FesamedCare!")


def test_la_confirmacion_no_valida_politica():
    """La comparación de las dos la hace el router, con un mensaje propio.

    Si la confirmación también validara política, un error de tecleo daría dos
    errores de reglas en vez de "las contraseñas no coinciden".
    """
    usuario = UserCreate(**BASE, plain_password="Fesamed2026!", plain_password_confirm="x")
    assert usuario.plain_password_confirm == "x"
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `docker exec -w /app web pytest tests/unit/api/v1/users/test_user_create_schema.py -q`

Expected: FAIL en `test_rechaza_una_contrasena_corta` y `test_rechaza_una_contrasena_sin_numero`, porque hoy `plain_password` es un `str` sin validación.

- [ ] **Step 3: Aplicar el tipo**

En `src/app/api/v1/users/schemas.py`, agregar el import:

```python
from src.app.api.v1.auth.password_policy import Password
```

y en la clase `UserCreate`, cambiar la línea 30:

```python
    plain_password: Password
```

Dejar `plain_password_confirm: str` sin tocar.

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `docker exec -w /app web pytest tests/unit/api/v1/users/test_user_create_schema.py -q`

Expected: `4 passed`

- [ ] **Step 5: Verificar que no se rompió la suite**

Run: `docker exec -w /app web pytest -q`

Expected: todo verde. Si algún test de registro usaba una contraseña que ya no cumple, actualizar esa contraseña en el test, no aflojar la política.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/v1/users/schemas.py tests/unit/api/v1/users/test_user_create_schema.py
git commit -m "fix: validar política de contraseña en el registro"
```

---

### Task 10: Página `/forgot-password`

Todo lo que sigue es en el repo `Fesamed-Front-End-NextJS`, rama `feat/admin`.

**Files:**
- Create: `src/app/forgot-password/page.tsx`
- Create: `src/app/ui/auth/forgot-password-form.tsx`
- Delete: `src/app/ui/auth/forgotPassword.tsx`
- Test: `scripts/password-reset.test.mjs`

**Interfaces:**
- Consumes: `POST /api/v1/forgot-password/` (Task 6), `apiClient` de `src/lib/api.ts`.
- Produces: nada que otras tareas usen.

- [ ] **Step 1: Escribir el test que falla**

Crear `scripts/password-reset.test.mjs`:

```javascript
/**
 * Pruebas del flujo de recuperación de contraseña.
 *
 * Correr:  npm test
 *
 * Las de integración necesitan el backend arriba en NEXT_PUBLIC_API_URL.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { parseErrorDetail } from '../src/lib/apiError.ts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const FRONT = process.env.FRONT_URL ?? 'http://localhost:3000';

describe('las páginas del flujo existen', () => {
  let front = false;

  before(async () => {
    try {
      const r = await fetch(FRONT, { signal: AbortSignal.timeout(8000) });
      front = r.ok;
    } catch {
      front = false;
    }
    if (!front) console.log(`  (saltadas: ${FRONT} no responde)`);
  });

  // Esta es la que falla al empezar: el enlace del login apunta a
  // /forgot-password y la página no existe, así que devuelve 404.
  test('/forgot-password responde 200', async (t) => {
    if (!front) return t.skip('front no disponible');

    const res = await fetch(`${FRONT}/forgot-password`, { signal: AbortSignal.timeout(20000) });
    assert.equal(res.status, 200);
  });
});

describe('forgot-password', () => {
  let up = false;

  before(async () => {
    try {
      const r = await fetch(`${API}/docs`, { signal: AbortSignal.timeout(4000) });
      up = r.ok;
    } catch {
      up = false;
    }
    if (!up) console.log(`  (saltadas: ${API} no responde)`);
  });

  test('un correo inexistente devuelve 200 y no revela nada', async (t) => {
    if (!up) return t.skip('backend no disponible');

    const res = await fetch(`${API}/api/v1/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'no-existe-jamas@example.com' }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const texto = body.message.toLowerCase();
    for (const filtracion of ['no existe', 'no encontr', 'no está registrado']) {
      assert.ok(!texto.includes(filtracion), `el mensaje filtra: "${filtracion}"`);
    }
  });

  test('un token basura en reset-password devuelve 400 con detail legible', async (t) => {
    if (!up) return t.skip('backend no disponible');

    const res = await fetch(`${API}/api/v1/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'basura',
        new_password: 'Fesamed2026!',
        new_password_confirm: 'Fesamed2026!',
      }),
    });

    assert.equal(res.status, 400);
    const mensaje = parseErrorDetail(await res.json(), res.status, res.statusText);
    assert.match(mensaje, /no es válido o ya expiró/);
  });

  test('una contraseña débil devuelve 422 y el mensaje de la regla', async (t) => {
    if (!up) return t.skip('backend no disponible');

    const res = await fetch(`${API}/api/v1/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'basura',
        new_password: 'corta',
        new_password_confirm: 'corta',
      }),
    });

    assert.equal(res.status, 422);
    const mensaje = parseErrorDetail(await res.json(), res.status, res.statusText);
    assert.match(mensaje, /8 caracteres/);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`

Expected: `/forgot-password responde 200` falla con `Expected values to be strictly equal: 404 !== 200`. Los tres de los endpoints deben **pasar**, porque las Tasks 6 y 7 ya los construyeron.

Si los de endpoints fallan con 404, las Tasks 6 o 7 no se completaron: parar y avisar.

- [ ] **Step 3: Crear el formulario**

Crear `src/app/ui/auth/forgot-password-form.tsx`:

```tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSentMessage('');
    setIsLoading(true);

    try {
      // El backend responde lo mismo exista la cuenta o no. Se muestra su
      // mensaje tal cual: inventar uno acá arriesgaría filtrar la diferencia.
      const res = await apiClient<{ message: string }>('/api/v1/forgot-password/', {
        method: 'POST',
        body: { email },
      });
      setSentMessage(res.message);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-gray-500 text-center mb-6">
                Escribe tu correo y te enviamos un enlace para crear una nueva.
              </p>
              <div className="flex flex-col items-center">
                {sentMessage ? (
                  <div className="w-80 flex flex-col gap-6">
                    <p className="text-sm text-gray-700">{sentMessage}</p>
                    <p className="text-sm font-light text-gray-500">
                      Revisa tu bandeja de entrada.{" "}
                      <Link href="/login" className="font-medium text-blue-500 hover:underline">
                        Volver a ingresar
                      </Link>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="flex flex-col gap-6 w-80">
                    <div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder="Correo"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                    <button
                      type="submit"
                      className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center disabled:opacity-70"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                    <p className="text-sm font-light text-gray-500">
                      ¿Ya la recordaste?{" "}
                      <Link href="/login" className="font-medium text-blue-500 hover:underline">
                        Ingresar
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Crear la página**

Crear `src/app/forgot-password/page.tsx`:

```tsx
import { ForgotPasswordForm } from "@/app/ui/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
```

- [ ] **Step 5: Borrar el componente huérfano**

```bash
git rm src/app/ui/auth/forgotPassword.tsx
```

Es código del proyecto Vite anterior: nadie lo importa, usa `import.meta.env.VITE_API_URL` y apunta a `/password/reset/message/:email`, que no existe. Dejarlo invita a que alguien lo use por error.

- [ ] **Step 6: Verificar que la página responde**

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/forgot-password
```

Expected: `200`. Antes era `404`.

- [ ] **Step 7: Verificar tipos y build**

```bash
npx tsc --noEmit
```

Expected: exit 0.

**No correr `npm run build` con `next dev` levantado.** Los dos escriben en `.next` y el dev server queda sirviendo 500 con `missing required error components`. Si pasa: Ctrl+C, `rm -rf .next && npm run dev`.

- [ ] **Step 8: Commit**

```bash
git add src/app/forgot-password/ src/app/ui/auth/forgot-password-form.tsx scripts/password-reset.test.mjs
git commit -m "feat: página de solicitud de recuperación de contraseña"
```

---

### Task 11: Página `/reset-password`

**Files:**
- Create: `src/app/reset-password/page.tsx`
- Create: `src/app/ui/auth/reset-password-form.tsx`
- Modify: `src/hooks/useAuth.ts` (`PUBLIC_PATHS`, línea 19)
- Modify: `scripts/password-reset.test.mjs` (creado en la Task 10)

**Interfaces:**
- Consumes: `POST /api/v1/reset-password/` (Task 7).
- Produces: nada que otras tareas usen.

- [ ] **Step 1: Escribir el test que falla**

En `scripts/password-reset.test.mjs`, dentro del `describe('las páginas del flujo existen', ...)` que creó la Task 10, agregar después del test de `/forgot-password`:

```javascript
  test('/reset-password responde 200 con y sin token', async (t) => {
    if (!front) return t.skip('front no disponible');

    const sinToken = await fetch(`${FRONT}/reset-password`, { signal: AbortSignal.timeout(20000) });
    assert.equal(sinToken.status, 200);

    const conToken = await fetch(`${FRONT}/reset-password?token=abc`, {
      signal: AbortSignal.timeout(20000),
    });
    assert.equal(conToken.status, 200);
  });
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm test`

Expected: `/reset-password responde 200 con y sin token` falla con `404 !== 200`. Todo lo demás en verde.

- [ ] **Step 3: Agregar la ruta a `PUBLIC_PATHS`**

En `src/hooks/useAuth.ts`, en el array `PUBLIC_PATHS`, después de `'/forgot-password',`:

```typescript
  '/reset-password',
```

Sin esto, `apiClient` trataría la página como privada y un 401 la redirigiría al login, sacando al usuario del flujo.

- [ ] **Step 4: Crear el formulario**

Crear `src/app/ui/auth/reset-password-form.tsx`:

```tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";

const REGLAS = [
  { etiqueta: 'Al menos 8 caracteres', ok: (v: string) => v.length >= 8 },
  { etiqueta: 'Una mayúscula', ok: (v: string) => /[A-Z]/.test(v) },
  { etiqueta: 'Una minúscula', ok: (v: string) => /[a-z]/.test(v) },
  { etiqueta: 'Un número', ok: (v: string) => /[0-9]/.test(v) },
  { etiqueta: 'Un carácter especial', ok: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cumpleTodo = REGLAS.every((r) => r.ok(password));
  const coinciden = password.length > 0 && password === confirm;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await apiClient('/api/v1/reset-password/', {
        method: 'POST',
        body: { token, new_password: password, new_password_confirm: confirm },
      });
      router.push('/login');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sin token no hay nada que hacer: se avisa sin llamar a la API.
  if (!token) {
    return (
      <div className="pt-16">
        <section className="bg-white">
          <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
            <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
              <div className="p-6 sm:p-8 text-center">
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl mb-4">
                  Enlace incompleto
                </h1>
                <p className="text-gray-500 mb-6">
                  Este enlace no trae el código de recuperación. Pide uno nuevo.
                </p>
                <Link href="/forgot-password" className="font-medium text-blue-500 hover:underline">
                  Pedir otro enlace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                Crea una contraseña nueva
              </h1>
              <p className="text-gray-500 text-center mb-6">
                Elige una que no hayas usado antes.
              </p>
              <div className="flex flex-col items-center">
                <form onSubmit={onSubmit} className="flex flex-col gap-6 w-80">
                  <div>
                    <input
                      type="password"
                      name="new_password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                      placeholder="Contraseña nueva"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="new_password_confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                      placeholder="Repite la contraseña"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {password.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {REGLAS.map((regla) => (
                        <li
                          key={regla.etiqueta}
                          className={`text-xs ${regla.ok(password) ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {regla.ok(password) ? '✓' : '○'} {regla.etiqueta}
                        </li>
                      ))}
                      <li className={`text-xs ${coinciden ? 'text-green-600' : 'text-gray-400'}`}>
                        {coinciden ? '✓' : '○'} Las dos coinciden
                      </li>
                    </ul>
                  )}

                  {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                  <button
                    type="submit"
                    className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center disabled:opacity-70"
                    disabled={isLoading || !cumpleTodo || !coinciden}
                  >
                    {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Crear la página con `Suspense`**

Crear `src/app/reset-password/page.tsx`:

```tsx
import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/ui/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="pt-16 text-center text-gray-500">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
```

`useSearchParams` obliga a envolver en `Suspense` para que la página prerrenderice, igual que `app/verify-email/page.tsx`.

- [ ] **Step 6: Verificar que la página responde en sus dos estados**

```bash
curl -s -o /dev/null -w "sin token: HTTP %{http_code}\n" http://localhost:3000/reset-password
curl -s -o /dev/null -w "con token: HTTP %{http_code}\n" "http://localhost:3000/reset-password?token=abc"
```

Expected: `200` las dos.

- [ ] **Step 7: Correr los tests del front**

Run: `npm test`

Expected: todo verde, incluidos los de `scripts/api-errors.test.mjs` y los tres de `password-reset.test.mjs`.

- [ ] **Step 8: Verificar tipos**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 9: Prueba manual del ciclo completo**

1. Ir a `http://localhost:3000/login` y hacer clic en "Olvidaste tu contraseña?".
2. Escribir `garxia0710@gmail.com` y enviar. Debe aparecer el mensaje neutro.
3. Abrir `http://localhost:8025`, buscar el correo y copiar el enlace.
4. Abrir el enlace. Escribir una contraseña que cumpla las cinco reglas y repetirla. El botón se habilita cuando todas están en verde.
5. Guardar. Debe redirigir a `/login`.
6. Ingresar con la contraseña nueva. Debe entrar.
7. Volver a abrir el enlace del correo. Debe decir que ya expiró.

- [ ] **Step 10: Commit**

```bash
git add src/app/reset-password/ src/app/ui/auth/reset-password-form.tsx src/hooks/useAuth.ts scripts/password-reset.test.mjs
git commit -m "feat: página para crear la contraseña nueva desde el enlace"
```

---

### Task 12: Conectar el cambio de contraseña del dashboard

**Files:**
- Modify: `src/app/ui/dashboard/config/changePassword.tsx` (archivo completo, 128 líneas)

**Interfaces:**
- Consumes: `PATCH /api/v1/me/password/` (Task 8).
- Produces: nada.

Además del `console.log`, este archivo tiene un bug de feedback visual de la misma familia que el de `api.ts`: la línea 16 es `useState<string | null>("Contraseña incorrecta")`. La página **abre** mostrando "Contraseña incorrecta" en rojo, con el borde del campo en rojo, antes de que el usuario escriba nada. Se arregla acá.

También mueve el error: hoy se pinta dentro del bloque del primer campo (línea 70), así que un "las contraseñas no coinciden" aparece debajo de "Contraseña actual", que no es donde está el problema.

- [ ] **Step 1: Reemplazar el archivo completo**

Sobrescribir `src/app/ui/dashboard/config/changePassword.tsx` con:

```tsx
"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api"

export function CambiarContrasena() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  // Arranca vacío. Antes venía con "Contraseña incorrecta" precargado, así que
  // la página abría con un error en rojo sin que el usuario hubiera hecho nada.
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const res = await apiClient<{ message: string }>("/api/v1/me/password/", {
        method: "PATCH",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        },
      })
      setSuccess(res.message)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      // apiClient ya tradujo el detail del backend, incluidos los 422 de
      // política con la regla que falló.
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Cambiar contraseña</CardTitle>
        <CardDescription className="text-sm md:text-base">
          Asegúrate de elegir una contraseña segura para proteger tu cuenta. Usa al menos 8 caracteres, incluyendo
          mayúsculas, minúsculas, números y símbolos especiales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Ingresa tu Contraseña actual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Contraseña nueva</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* El mensaje va junto al botón, no dentro del primer campo: un error
              de confirmación no pertenece debajo de "Contraseña actual". */}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

Cambios respecto al original: `error` arranca en `null`; se agregan `success` e `isLoading`; `handleSubmit` pasa a `async` y llama a la API; el `className` condicional con `border-red-500` sale de los tres `Input`; el mensaje se mueve de la línea 70 a junto al botón; los tres campos y el botón se deshabilitan mientras carga.

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 3: Prueba manual**

1. Ingresar y ir a `http://localhost:3000/dashboard/settings/change-password`. **La página debe abrir sin ningún mensaje rojo.** Si aparece "Contraseña incorrecta" al cargar, el Step 1 no se aplicó.
2. Poner una contraseña actual equivocada. Debe verse en rojo "La contraseña actual no es correcta."
3. Poner la actual correcta y una nueva de 4 caracteres. Debe verse el mensaje de la regla de longitud, que llega del 422 de Pydantic vía `parseErrorDetail`.
4. Poner la actual correcta y una nueva válida. Debe verse "Contraseña actualizada." en verde y los tres campos vaciarse.
5. Cerrar sesión y entrar con la nueva.

- [ ] **Step 4: Build de producción**

Con el dev server **detenido**:

```bash
rm -rf .next
npm run build
```

Expected: exit 0, y en la tabla de rutas deben aparecer `/forgot-password` y `/reset-password`.

- [ ] **Step 5: Commit**

```bash
git add src/app/ui/dashboard/config/changePassword.tsx
git commit -m "feat: conectar el cambio de contraseña del dashboard con la API"
```

---

## Cierre

- [ ] **Suite completa del backend**

Run: `docker exec -w /app web pytest -q`

- [ ] **Suite completa del frontend**

Run: `npm test`

- [ ] **Revisar que no quedó nada del componente huérfano**

Run: `grep -rn "forgotPassword\|VITE_API_URL" src/`

Expected: sin resultados.

- [ ] **Confirmar que el enlace del login ya no da 404**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/forgot-password`

Expected: `200`

## Pendiente que no se resuelve en este plan

**La plantilla de Brevo.** `EmailTemplate.PASSWORD_RESET` no tiene id en `BREVO_TEMPLATES`. Con la Task 5 hecha, producción sí llega a Brevo, y `brevo_provider.py:16` lanza `ValueError` cuando no encuentra el id. Hay que crear la plantilla en Brevo con las variables `user_name` y `reset_url`, y agregar su id a `BREVO_TEMPLATES` en `src/.env`. En desarrollo no molesta porque se usa Mailhog.

**Los tres bugs de la imagen de producción de `deploy-beta`:** el typo `alemic` en `entrypoints/web-entrypoint.sh`, las rutas `/app/scripts/` del `Dockerfile` apuntando a un directorio inexistente, y `settings.FILE_LOG_INCLUDE_*` en `core/logging/logger.py` cuando en `config.py` se llaman `BETTERSTACK_INCLUDE_*`. No afectan desarrollo ni esta funcionalidad, pero bloquean el despliegue.
