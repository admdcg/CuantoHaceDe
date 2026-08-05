-- Rol de aplicación sin privilegios (opcional pero recomendado).
--
-- Railway entrega un rol postgres superusuario, y un superusuario se salta
-- las políticas de RLS. Mientras la aplicación conecte con él, el aislamiento
-- entre usuarios lo garantizan solo los filtros explícitos por user_id de las
-- consultas. Creando este rol y apuntando DATABASE_URL a él, RLS pasa a ser
-- una segunda barrera real.
--
-- Uso (sustituye la contraseña por una generada, p. ej. openssl rand -base64 24):
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
--        -v app_password="'una-contraseña-larga'" -f db/create-app-role.sql
--
-- Después actualiza DATABASE_URL en Railway para que use app_user en lugar de
-- postgres, manteniendo host, puerto y nombre de base de datos.
--
-- IMPORTANTE: app_user no puede crear tablas, así que las migraciones dejarían
-- de arrancar. Añade también MIGRATION_DATABASE_URL con la cadena original del
-- rol postgres; el script de migración la prefiere cuando existe.

create role app_user with login password :app_password;

-- :DBNAME lo define psql con la base a la que está conectado; GRANT no admite
-- una expresión como current_database() aquí.
grant connect on database :"DBNAME" to app_user;
grant usage on schema public to app_user;

grant select, insert, update, delete on public.users to app_user;
grant select, insert, update, delete on public.tasks to app_user;
grant select, insert, update, delete on public.executions to app_user;

grant execute on function public.current_app_user() to app_user;

-- Las migraciones futuras seguirán ejecutándose con el rol postgres, así que
-- conviene que los objetos nuevos concedan permisos a app_user por defecto.
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;
