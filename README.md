# pagarCasa

Proyecto para gestionar pagos mensuales de servicios de la casa.

## Configuración

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Obtén tu URL del proyecto y la clave anónima.

Uso recomendado para repositorios públicos / despliegues

- No pongas las claves en el repositorio. Usa GitHub Environments (tienes un environment llamado `prod`) y añade allí los Secrets `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Durante el build/deploy, inyecta las variables a la app creando un archivo `env.js` que exponga `window.__ENV__`.

Ejemplo de paso en GitHub Actions para crear `env.js` (añádelo antes de desplegar o construir los assets):

```yaml
- name: Create env file
    run: |
        cat > ./public/env.js <<EOF
        window.__ENV__ = {
            SUPABASE_URL: "${{ secrets.SUPABASE_URL }}",
            SUPABASE_ANON_KEY: "${{ secrets.SUPABASE_ANON_KEY }}"
        }
        EOF
```

Luego incluye `env.js` en tu `index.html` antes de los scripts de la app:

```html
<script src="/env.js"></script>
<script src="/app.js"></script>
```

El archivo `config.js` ya está preparado para leer `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde el entorno (build-time) o desde `window.__ENV__` (runtime).

## Desarrollo local

1. Copia `.env.example` a `.env` y edita las variables con tus claves:

```bash
cp .env.example .env
# editar .env y poner SUPABASE_URL y SUPABASE_ANON_KEY
```

2. Genera `public/env.js` desde `.env`:

```bash
npm run create-env
```

3. Levanta un servidor local y prueba la app:

```bash
npm run dev
```

`public/env.js` se genera localmente y está en `.gitignore` — no se sube al repo.

## Estructura de la Base de Datos

Ejecuta el siguiente SQL en el SQL Editor de Supabase para crear las tablas:

```sql
-- Crear tabla accounts
CREATE TABLE accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_name TEXT NOT NULL,
    client_number TEXT,
    payment_link TEXT
);

-- Crear tabla payments
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PAGADO', 'POR PAGAR')),
    amount NUMERIC
);

-- Insertar datos iniciales
INSERT INTO accounts (service_name, client_number, payment_link) VALUES
('Arriendo', 'Emilia Alejandra Reyes Rodríguez\n15.367.756-5\nBanco Santander\nCuenta corriente\n6318743-7', 'anda al banco son 620'),
('Enel', '28288344', 'https://www.enel.cl/es/clientes/servicios-en-linea/pago-de-cuenta.html'),
('Aguas Andinas', '1842954', 'https://www.aguasandinas.cl/web/aguasandinas/pagar-mi-cuenta'),
('Metrogas', '900677476', 'https://sucursalvirtual.metrogas.cl/publico/pagos/consulta'),
('Movistar Internet - contraseña entre 8 y 16 char', '18638901-8', 'https://mi.movistar.cl/'),
('GG.CC', '', 'A traves aplicacion Comunidad Feliz');
```

## Uso

Abre `index.html` en un navegador. La aplicación cargará las cuentas y permitirá gestionar los pagos mensuales.

- Para el mes actual, marca servicios como pagados y opcionalmente ingresa el monto.
- La tabla de historial muestra todos los pagos registrados.
