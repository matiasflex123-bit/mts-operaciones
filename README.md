# MTS SECURITY · Plataforma interna de operaciones

Plataforma privada para el personal de **MTS SECURITY SPA**: proyectos, levantamientos, bitácora diaria con fotos, equipos e IPs.

- **Página:** publicada con GitHub Pages (archivos estáticos de esta carpeta).
- **Datos, login y fotos:** Supabase (`supabase/instalacion.sql`). Los permisos se validan en la base de datos, no en la página.

## Roles
| Acción | Administrador | Técnico |
|---|---|---|
| Ver proyectos y levantamientos | ✔ | ✔ |
| Comentar, registrar avances, subir fotos | ✔ | ✔ |
| Agregar equipos / IPs | ✔ | ✔ (edita solo los suyos) |
| Crear y editar proyectos / levantamientos | ✔ | — |
| Cambiar estados | ✔ | — |
| Crear usuarios, eliminar contenido, respaldos | ✔ | — |

## Instalación
1. En Supabase → **SQL Editor**, pegar y ejecutar `supabase/instalacion.sql`.
2. En Supabase → **Authentication → Sign In / Providers**: desactivar *Allow new users to sign up* y *Confirm email*.
3. Copiar la *Project URL* y la clave *anon public* (Project Settings → API) en `config.js`.
4. Subir esta carpeta a GitHub y activar **Settings → Pages** (rama `main`, carpeta raíz).
