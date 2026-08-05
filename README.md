# ¿Cuánto hace de?

Registro de tareas periódicas: cada tarea guarda cuándo se hizo por última vez,
cuántas veces se ha hecho y cada cuánto se repite de media.

- `apps/web` — aplicación Next.js 16 (App Router)
- `packages/types` — tipos compartidos
- `db/migrations` — esquema SQL, se aplica solo al arrancar

## Desarrollo

```bash
npm install
cp .env.example .env.local          # rellena DATABASE_URL y SESSION_SECRET
node apps/web/scripts/migrate.mjs   # crea el esquema
npm run dev
```

`SESSION_SECRET` firma la cookie de sesión y necesita 32 caracteres como
mínimo: `openssl rand -base64 32`.

Comprobaciones:

```bash
npm run type-check -w apps/web
npm run lint -w apps/web
npm run test -w apps/web
```

## Despliegue en Railway

La aplicación se construye con el `Dockerfile` de la raíz y se sirve con la
salida `standalone` de Next. Las migraciones corren en el arranque del
contenedor, son idempotentes y toman un advisory lock, así que varias réplicas
arrancando a la vez no se pisan.

1. Crea un proyecto en Railway y añade un servicio **Postgres**.
2. Añade un segundo servicio desde este repositorio. Railway detecta
   `railway.json` y construye con el Dockerfile.
3. Configura las variables del servicio web:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` — usa la red privada del proyecto |
   | `SESSION_SECRET` | una cadena de 32+ caracteres |

4. Despliega. El primer arranque crea el esquema.

### Endurecer el acceso a la base de datos (recomendado)

El rol `postgres` que entrega Railway es superusuario y **se salta las
políticas de RLS**. Mientras la aplicación conecte con él, el aislamiento entre
usuarios lo garantizan solo los filtros por `user_id` de las consultas. Para
tener RLS como segunda barrera:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
     -v app_password="'$(openssl rand -base64 24)'" \
     -f db/create-app-role.sql
```

Después, en Railway:

- `DATABASE_URL` → la misma cadena pero con el usuario `app_user` y su contraseña
- `MIGRATION_DATABASE_URL` → la cadena original del rol `postgres`

Ese segundo valor es necesario porque `app_user` no puede crear tablas y las
migraciones dejarían de arrancar.

## Arquitectura

| Pieza | Dónde |
|---|---|
| Sesión (JWT firmado en cookie httpOnly) | `apps/web/src/lib/auth/token.ts`, `session.ts` |
| Contraseñas (scrypt) | `apps/web/src/lib/auth/password.ts` |
| Comprobación de sesión autoritativa | `apps/web/src/lib/auth/dal.ts` |
| Redirección optimista | `apps/web/src/proxy.ts` |
| Acceso a Postgres y contexto de RLS | `apps/web/src/lib/db/index.ts` |

Cada consulta de datos pasa por `withUser()`, que abre una transacción y fija
`app.user_id`; las políticas de `db/migrations/001_init.sql` leen esa variable.
Las consultas filtran además por `user_id` de forma explícita, de modo que el
aislamiento no depende de con qué rol se haya conectado.
