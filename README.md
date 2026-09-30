# Backend SSR Challenge: API de gestión de películas

API REST hecha con **NestJS** que permite registrarse, iniciar sesión y gestionar películas. Incluye autenticación con **JWT**, autorización por **roles** (administrador y usuario regular) y una sincronización con la API de Star Wars.

## Tecnologías

- NestJS, TypeScript
- PostgreSQL con TypeORM
- Passport + JWT para la autenticación, bcrypt para las contraseñas
- class-validator para validar los datos de entrada y Joi para validar las variables de entorno
- Swagger para la documentación de la API
- Jest para las pruebas

## Requisitos

- **Node.js**, probado con la versión 24. `@nestjs/config` es un paquete ESM, así que hace falta una versión de Node que permita cargarlo con `require()` (20.19 o superior, o 22.12 o superior).
- **Docker**, para levantar la base de datos PostgreSQL.

## Puesta en marcha

1. Clonar el proyecto e instalar las dependencias:

   ```bash
   npm install
   ```

2. Copiar el archivo `.env.example` con el nombre `.env` y completar las variables (ver la tabla de abajo).

3. Levantar la base de datos. **Tiene que hacerse después de crear el `.env`**, porque Docker toma de ahí el usuario, la contraseña y el nombre de la base:

   ```bash
   docker compose up -d
   ```

   (En versiones antiguas de Docker el comando es `docker-compose up -d`).

4. Iniciar la aplicación en modo desarrollo:

   ```bash
   npm run start:dev
   ```

La API queda disponible en `http://localhost:3000/api`. Al arrancar por primera vez se crean las tablas y el usuario administrador (ver más abajo).

### Variables de entorno

La aplicación **valida estas variables al iniciar** y no arranca si falta alguna, indicando cuál.

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno: `dev`, `prod` o `test`. Las tablas solo se crean y sincronizan automáticamente en `dev` | `dev` |
| `PORT` | Puerto de la API (opcional, por defecto 3000) | `3000` |
| `DB_HOST` | Servidor de la base de datos | `localhost` |
| `DB_PORT` | Puerto de la base de datos | `5432` |
| `DB_USERNAME` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | a elección |
| `DB_NAME` | Nombre de la base de datos | `challengedb` |
| `JWT_SECRET` | Clave con la que se firman los tokens | ver el comando de abajo |
| `STAR_WARS_API_URL` | URL base de la API de Star Wars | `https://swapi.dev/api` |
| `ADMIN_EMAIL` | Email del usuario administrador inicial | `admin@example.com` |
| `ADMIN_PASSWORD` | Contraseña del administrador inicial | `Admin123` |
| `ADMIN_FULLNAME` | Nombre del administrador inicial | `Admin` |

Para generar un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Los valores de `ADMIN_*` del `.env.example` son **solo para desarrollo**. En cualquier otro entorno hay que cambiarlos.

## Usuario administrador

Al iniciar, la aplicación crea automáticamente un usuario administrador con las credenciales `ADMIN_EMAIL` y `ADMIN_PASSWORD` del `.env`. No hace falta llamar a ningún endpoint.

- Si el usuario ya existe, no hace nada, así que se puede reiniciar la aplicación sin duplicarlo.
- Si ya existe un usuario con ese email pero sin rol de administrador, no lo modifica y deja un aviso en el log.

Con el `.env.example` las credenciales son `admin@example.com` y `Admin123`. Las personas que se registren con `sign-up` siempre reciben el rol `user`: los roles no se pueden elegir al registrarse.

## Documentación de la API (Swagger)

Con la aplicación corriendo, la documentación interactiva está en:

**http://localhost:3000/api/docs**

Para probar los endpoints protegidos:

1. Ejecutar `POST /api/auth/sign-in` (o `sign-up`) desde Swagger y copiar el `token` de la respuesta.
2. Hacer clic en **Authorize** (arriba a la derecha) y pegar el token.
3. Los endpoints con candado ya se pueden ejecutar desde "Try it out".

## Endpoints y permisos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/sign-up` | Público | Registra un usuario (rol `user`) y devuelve un token |
| POST | `/api/auth/sign-in` | Público | Inicia sesión y devuelve un token (vale 2 horas) |
| GET | `/api/film` | Cualquier usuario autenticado | Lista las películas |
| GET | `/api/film/:id` | Solo rol `user` | Detalle de una película |
| POST | `/api/film` | Solo `admin` | Crea una película |
| PATCH | `/api/film/:id` | Solo `admin` | Actualiza una película |
| DELETE | `/api/film/:id` | Solo `admin` | Elimina una película |
| POST | `/api/film/sync` | Solo `admin` | Sincroniza las películas con la API de Star Wars |

Los endpoints protegidos esperan el header `Authorization: Bearer <token>`.

**Respuestas de error habituales:** `400` datos inválidos o `id` que no es un UUID, `401` token ausente, inválido o vencido, `403` el usuario no tiene el rol necesario, `404` película inexistente, `502` la API de Star Wars no respondió.

```

### Reglas de los datos

- **Registro:** el email debe ser válido y la contraseña debe tener entre 6 y 50 caracteres, con mayúscula, minúscula y un número (o carácter especial).
- **Películas:** `release_date` se envía en formato `AAAA-MM-DD`, y `characters`, `planets`, `starships`, `vehicles` y `species` son listas de textos. Los campos `created` y `edited` los completa siempre el servidor y no se pueden enviar.
- Cualquier campo que no pertenezca al formato esperado se rechaza con `400`.

## Pruebas

```bash
# Pruebas unitarias (no necesitan base de datos ni internet)
npm test

# Con informe de cobertura
npm run test:cov

# Prueba e2e: levanta la aplicación completa, necesita la base de datos y el .env configurados
npm run test:e2e
```

Usar siempre los scripts de `npm`: llevan la opción que Jest necesita para cargar `@nestjs/config`, y ejecutar `npx jest` directamente falla.

Las pruebas unitarias cubren el servicio y el controlador de autenticación, el guard de roles, la estrategia JWT, el seed del administrador, el validador de fechas y el servicio y el controlador de películas. Verifican, entre otras cosas, el rol que exige cada endpoint y los distintos casos de error de la sincronización.

## Decisiones de diseño

- **Token mínimo:** el JWT solo contiene el id del usuario. Los roles **no** se guardan en el token: se leen de la base en cada petición, de modo que un cambio de rol se aplica de inmediato.
- **Roles como lista de textos** dentro del usuario, en lugar de una tabla aparte. Es lo más simple para dos roles fijos. Los valores válidos están en un enum.
- **Detalle de película solo para el rol `user`:** el enunciado dice "solo los usuarios regulares", así que un administrador recibe `403` en ese endpoint.
- **Listado para cualquier usuario autenticado:** el enunciado no lo restringe por rol.
- **Sincronización con Star Wars:** se hace por endpoint (solo administradores). Guarda cada película por su id de Star Wars y **sobrescribe los cambios locales** de las películas sincronizadas. Si la API externa falla, responde `502` con un mensaje que indica la causa (error, tiempo agotado o sin conexión) y no guarda nada a medias.
- **Fechas manejadas por el servidor:** `created` y `edited` se completan automáticamente, y `edited` se actualiza en cada modificación.
- **Mismo mensaje para email o contraseña incorrectos** en el login, para no revelar qué emails están registrados.
- **Configuración validada al arrancar:** las variables de entorno se leen con `ConfigService` y se validan con Joi, sin valores por defecto para los secretos.


## Estructura del proyecto

```
src/
├── auth/        Registro, login, JWT, guard de roles y seed del administrador
├── film/        CRUD de películas y sincronización con Star Wars
├── config/      Variables de entorno y su validación
├── database/    Conexión a PostgreSQL
└── common/      Validadores reutilizables
```

## Problemas frecuentes

- **La aplicación no arranca y nombra una variable:** falta esa variable en el `.env`. Compararlo con `.env.example`.
- **Error de autenticación con la base de datos:** el usuario y la contraseña de Postgres se definen solo la primera vez que se crea el contenedor. Si cambiaste `DB_USERNAME` o `DB_PASSWORD` después, hay que borrar el volumen y volver a crearlo (**esto elimina los datos**):

  ```bash
  docker compose down -v
  docker compose up -d
  ```

- **`POST /api/film/sync` responde `502`:** la API de Star Wars (`swapi.dev`) no está disponible en ese momento. Reintentar más tarde; el mensaje de la respuesta indica la causa.
