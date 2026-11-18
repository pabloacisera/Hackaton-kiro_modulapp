# Guía de Deploy — ModulaApp (Render free)

> **IMPORTANTE:** Sigue cada paso en orden. Si omites un paso, el deploy fallará.
> Última actualización: 2026-11-15
>
> **Hosting actual: [Render](https://render.com) (plan free)**, con base de datos en
> **Neon** y **Redis en Upstash**. La infraestructura AWS/Terraform que describía este
> documento antes quedó **obsoleta** (la cuenta AWS se perdió). El código de
> `infra/terraform/` se conserva solo como referencia histórica — ver
> [`docs/terraform-guide.md`](docs/terraform-guide.md) (marcado como legacy).
>
> ¿Vienes de otro proveedor? La guía abstracta de migración está fuera del repo, en
> `Documentacion/02_Guias/aws_migration/`.

---

## Tabla de Contenidos

1. [Arquitectura en Producción](#1-arquitectura-en-producción)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Preparar las Variables de Entorno](#3-preparar-las-variables-de-entorno)
4. [Base de Datos (Neon) y Redis (Upstash)](#4-base-de-datos-neon-y-redis-upstash)
5. [Configurar PayPal](#5-configurar-paypal)
6. [Crear los Servicios en Render](#6-crear-los-servicios-en-render)
7. [Dominio Custom y DNS (Cloudflare)](#7-dominio-custom-y-dns-cloudflare)
8. [CI-gated Deploy (GitHub Actions → Render)](#8-ci-gated-deploy-github-actions--render)
9. [Datos de Ejemplo (Seed) e Imágenes](#9-datos-de-ejemplo-seed-e-imágenes)
10. [Verificar el Deploy](#10-verificar-el-deploy)
11. [Operaciones (Render API)](#11-operaciones-render-api)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Arquitectura en Producción

```
Cloudflare (DNS-only CNAME)
        │
        ▼
modula-web  (Render free, Docker: nginx + landing + admin)   ← https://modulapp.artisandevs.site
  ├── /                → landing (estático)
  ├── /admin/          → admin dashboard (estático, base /admin/)
  ├── /api/*  ───────► modula-api.onrender.com        (strip /api/)
  ├── /socket.io/* ──► modula-api.onrender.com        (preserva)
  ├── /health ───────► modula-api.onrender.com/health
  └── /payments/* ───► modula-payment.onrender.com    (preserva prefijo)

modula-api      (Render free, Docker: NestJS api-core)   → Neon (api-core) + Upstash
modula-payment  (Render free, Docker: Spring Boot)       → Neon (payment) + PayPal
```

> **Clave:** los *free web services* de Render **no pueden recibir tráfico por la red
> privada** (solo enviarlo). Por eso `modula-web` (front-door) proxea a las **URLs
> públicas** de los otros servicios, no a nombres internos.

| Componente                    | Dónde corre                          |
| ----------------------------- | ------------------------------------ |
| Landing (React)               | `modula-web` — nginx sirve estáticos |
| Admin Dashboard (React)       | `modula-web` — nginx sirve estáticos |
| API Core (NestJS)             | `modula-api` (contenedor Docker)     |
| Payment Service (Spring Boot) | `modula-payment` (contenedor Docker) |
| Nginx (reverse proxy)         | `modula-web` (front-door)            |
| PostgreSQL                    | **Neon** (2 bases, external)         |
| Redis                         | **Upstash** (REST cache + TCP BullMQ)|
| HTTPS / DNS                   | **Cloudflare** (DNS-only)            |
| Email                         | Mailjet (external)                   |
| Pagos                         | PayPal API (external)                |
| Storage                       | Supabase Storage (external)          |

---

## 2. Requisitos Previos

```bash
# Render CLI (opcional) o acceso a la API de Render
# Cuenta de Render con un API key: Dashboard → Account Settings → API Keys
export RENDER_API_KEY="rnd_..."     # NO commitear

# Cloudflare (DNS del dominio) — token con permiso DNS:Edit
# Neon (Postgres serverless) y Upstash (Redis) ya provisionados

# Herramientas locales
psql --version        # cliente PostgreSQL (Neon)
node --version        # >= 20 (para generar hash de password / seed)
docker --version      # para el contenedor one-off de seed
```

Servicios externos que deben existir **antes** de deployar:

1. **Neon** — 2 bases Postgres (api-core y payment-service).
2. **Upstash** — Redis REST (cache/rate-limit) **y** endpoint TCP `rediss://` (BullMQ).
3. **Supabase** — proyecto + bucket público para imágenes/PDFs.
4. **PayPal** — app (sandbox o live) con webhook.
5. **Mailjet** — cuenta + sender verificado.
6. **Cloudflare** — dominio con acceso DNS.

---

## 3. Preparar las Variables de Entorno

Copia tu `.env` y ajusta los valores de producción. **No subas el `.env` al repo.**
Los valores se cargan por servicio en Render (paso 6).

### 3.1 Valores que DEBES cambiar para producción

```env
# ─── URLs Públicas ─────────────────────────────────────────────────────────
APP_PUBLIC_URL=https://modulapp.artisandevs.site
VITE_API_URL=/api

# ─── CORS ─────────────────────────────────────────────────────────────────
CORS_ORIGINS=https://modulapp.artisandevs.site

# ─── Admin Dashboard URL (para emails de registro) ────────────────────────
ADMIN_DASHBOARD_URL=https://modulapp.artisandevs.site/admin

# ─── API ↔ payment-service (URLs PÚBLICAS de Render) ──────────────────────
# api-core llama al payment-service por su URL pública:
PAYMENT_SERVICE_URL=https://modula-payment.onrender.com
# payment-service llama a api-core por su URL pública:
API_CORE_WEBHOOK_URL=https://modula-api.onrender.com

# ─── Redis BullMQ (TCP persistente — Upstash) ─────────────────────────────
BULL_REDIS_URL=rediss://default:PASSWORD@HOST.upstash.io:6379

# ─── PayPal ───────────────────────────────────────────────────────────────
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_URL=https://modulapp.artisandevs.site/payments/webhooks/paypal

# ─── Entornos ─────────────────────────────────────────────────────────────
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production
```

### 3.2 Valores que se mantienen

```env
DATABASE_URL=postgresql://...            # Neon (api-core)
PAYMENT_DATABASE_URL=postgresql://...    # Neon (payment-service)
UPSTASH_REDIS_REST_URL=...               # cache/rate-limiting
UPSTASH_REDIS_REST_TOKEN=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
QUOTE_TOKEN_SECRET=...                   # ⚠️ el código usa QUOTE_TOKEN_SECRET
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...                    # se actualiza en el paso 5
MAILJET_API_KEY=...
MAILJET_API_SECRET=...
MAILJET_FROM_EMAIL=...
MAILJET_FROM_NAME=...
SUPABASE_URL=...                         # sin /rest/v1/
SUPABASE_STORAGE_BUCKET=modulapp_bucket
SUPABASE_SERVICE_ROLE_KEY=...
WEBHOOK_SHARED_SECRET=...
```

> **Nota:** `QUOTE_ACTION_TOKEN_SECRET` que aparecía en docs viejas **no existe** en el
> código; el nombre real es `QUOTE_TOKEN_SECRET`. Ver
> [`.kiro/steerings/09-environment-variables.md`](.kiro/steerings/09-environment-variables.md).

---

## 4. Base de Datos (Neon) y Redis (Upstash)

### 4.1 Neon — dos bases Postgres

Neon provee dos connection strings (usar la variante **pooled** para la app):

- `DATABASE_URL` → base de **api-core** (Prisma).
- `PAYMENT_DATABASE_URL` → base del **payment-service** (Flyway).

Las migraciones corren **solas al arrancar** los contenedores:

- `modula-api`: `prisma migrate deploy` en el `CMD`.
- `modula-payment`: Flyway al iniciar Spring Boot.

> Neon entra en "suspended" por scale-to-zero; es normal. La primera request tras
> inactividad tarda unos segundos en despertar.

### 4.2 Upstash — dos usos

| Uso | Variable | Protocolo |
| --- | --- | --- |
| Cache / rate-limiting | `UPSTASH_REDIS_REST_URL` + `_TOKEN` | REST (HTTP) |
| BullMQ (colas) | `BULL_REDIS_URL` | TCP `rediss://` |

> BullMQ necesita **TCP persistente**; el endpoint REST **no** sirve para colas.

---

## 5. Configurar PayPal

1. https://developer.paypal.com/dashboard/applications → tu app.
2. **Webhooks** → Add/Edit:
   - **Webhook URL:** `https://modulapp.artisandevs.site/payments/webhooks/paypal`
   - **Events:** `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
     `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`.
3. Copia el **Webhook ID** → `PAYPAL_WEBHOOK_ID` en el servicio `modula-payment`.
4. Return URLs (se construyen desde `APP_PUBLIC_URL`):
   - Éxito: `https://modulapp.artisandevs.site/checkout/success`
   - Cancelado: `https://modulapp.artisandevs.site/checkout/cancel`

Para **live**: cambiar `PAYPAL_MODE=live`, usar credenciales live y crear un webhook
live con la misma URL.

---

## 6. Crear los Servicios en Render

Tres **Web Services** (plan free, region `oregon`, branch `main`), cada uno con build por
**Dockerfile**:

| Servicio         | Dockerfile                    | Contexto             | Health | URL pública                         |
| ---------------- | ----------------------------- | -------------------- | ------ | ----------------------------------- |
| `modula-api`     | `apps/api-core/Dockerfile`    | `.` (raíz)           | `/health` | `https://modula-api.onrender.com`   |
| `modula-payment` | `apps/payment-service/Dockerfile` | `apps/payment-service` | `/health` | `https://modula-payment.onrender.com` |
| `modula-web`     | `infra/render/Dockerfile.web` | `.` (raíz)           | `/`    | `https://modula-web-x8xk.onrender.com` |

> `modula-web` usa `envsubst` en el arranque con `$PORT`, `$API_CORE_URL` y `$PAYMENT_URL`.
> Render inyecta `$PORT`; los servicios deben escuchar en `0.0.0.0:$PORT`.

### 6.1 Env vars por servicio

**`modula-api`** (`NODE_ENV=production`):

```
DATABASE_URL, BULL_REDIS_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, QUOTE_TOKEN_SECRET, WEBHOOK_SHARED_SECRET,
PAYMENT_SERVICE_URL=https://modula-payment.onrender.com,
APP_PUBLIC_URL, CORS_ORIGINS, ADMIN_DASHBOARD_URL,
SUPABASE_URL, SUPABASE_STORAGE_BUCKET, SUPABASE_SERVICE_ROLE_KEY,
MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_FROM_EMAIL, MAILJET_FROM_NAME,
ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, NODE_ENV=production
```

**`modula-payment`** (`SPRING_PROFILES_ACTIVE=production`):

```
PAYMENT_DATABASE_URL, API_CORE_WEBHOOK_URL=https://modula-api.onrender.com,
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE, PAYPAL_WEBHOOK_ID,
MAILJET_API_KEY, MAILJET_API_SECRET, MAILJET_FROM_EMAIL, MAILJET_FROM_NAME,
SUPABASE_URL, SUPABASE_STORAGE_BUCKET, SUPABASE_SERVICE_ROLE_KEY,
APP_PUBLIC_URL, SPRING_PROFILES_ACTIVE=production
```

**`modula-web`** (front-door):

```
API_CORE_URL=https://modula-api.onrender.com
PAYMENT_URL=https://modula-payment.onrender.com
```

### 6.2 Auto-deploy

Dejar **`autoDeploy: no`** en los tres servicios: los deploys los dispara el job de CI
(paso 8), no el push directo de Render.

---

## 7. Dominio Custom y DNS (Cloudflare)

1. En Render → servicio `modula-web` → **Settings → Custom Domains** → agregar
   `modulapp.artisandevs.site`. Render lo marca como **verified** tras validar el DNS.
2. En **Cloudflare DNS** (zona `artisandevs.site`) crear un **CNAME DNS-only**:

   | Tipo  | Nombre     | Valor                            | Proxy   |
   | ----- | ---------- | -------------------------------- | ------- |
   | CNAME | `modulapp` | `modula-web-x8xk.onrender.com`   | DNS only (nube gris) |

   > **DNS-only** (no proxied) para no romper la emisión/renovación del TLS de Render.

3. Verificar propagación:

   ```bash
   dig +short modulapp.artisandevs.site CNAME
   curl -fsS https://modulapp.artisandevs.site/health
   ```

---

## 8. CI-gated Deploy (GitHub Actions → Render)

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) tiene dos jobs:

1. **`lint-test-build`** — `pnpm install` → `prisma generate` → `turbo lint` → `turbo test`
   → `turbo build` (en push y PR a `main`).
2. **`deploy`** — corre **solo si `lint-test-build` pasó** y el evento es **push a `main`**
   (nunca en PR). Dispara `POST /services/{id}/deploys` sobre los 3 servicios de Render.

Requisito único: el secret **`RENDER_API_KEY`** en el repositorio de GitHub
(Settings → Secrets and variables → Actions).

```bash
# Crear el secret (una vez), con gh:
gh secret set RENDER_API_KEY --body "$RENDER_API_KEY"
```

> Si el CI está en rojo, **no** hay deploy: esa es la garantía de que a producción solo
> llega código que pasó lint + tests + build.

---

## 9. Datos de Ejemplo (Seed) e Imágenes

### 9.1 Seed

`SeedService` corre **solo si `NODE_ENV !== 'production'`** y es **idempotente** (sale si
ya hay prototipos). Para poblar Neon con datos de ejemplo, correr un contenedor one-off
con la imagen ya construida:

```bash
# 1) generar un env-file sin comillas (ojo: '&' en URLs rompe `source`)
# 2) correr con NODE_ENV=development
docker run -d --name modula-seed --env-file seed.env <imagen-api>
docker logs -f modula-seed     # esperar "Seeded ..." y "Nest application successfully started"
docker rm -f modula-seed
```

Admin por defecto: `admin@modulapp.com` / `Password123456`
(override con `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`). Para altas posteriores usar
`sql/bootstrap-admin.sql` (hash argon2) o el endpoint `admin/auth/register`.

### 9.2 Imágenes

- **Producto nuevo:** se crea con `images: []`; la imagen se sube aparte con
  `POST /admin/catalog/prototypes/:id/images` (multipart) → `StorageService` la guarda en
  **Supabase Storage** (`modulapp_bucket/products/…`) y persiste la **URL pública absoluta**.
- **Datos de ejemplo:** el seed referencia objetos determinísticos
  `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/products/seed-<slug>.jpg`.
  Las imágenes fuente viven en `infra/seed-images/` y se suben una vez:

  ```bash
  ./infra/seed-images/upload.sh   # idempotente (x-upsert)
  ```

- **Fallback:** `apps/landing/public/placeholder.jpg` se usa cuando un prototipo no tiene
  imágenes.

---

## 10. Verificar el Deploy

```bash
# Landing
curl -s -o /dev/null -w "%{http_code}\n" https://modulapp.artisandevs.site/          # 200

# Admin dashboard + assets
curl -s -o /dev/null -w "%{http_code}\n" https://modulapp.artisandevs.site/admin/     # 200

# API health (vía front-door)
curl -fsS https://modulapp.artisandevs.site/health                                    # {"status":"ok"}

# Catálogo (proxy /api → modula-api)
curl -fsS https://modulapp.artisandevs.site/api/catalog/prototypes | head

# Login admin (espera 201 + accessToken)
curl -fsS -X POST https://modulapp.artisandevs.site/api/admin/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@modulapp.com","password":"<PASSWORD>"}'

# Webhook de PayPal (sin firma → 401, es lo esperado)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://modulapp.artisandevs.site/payments/webhooks/paypal
```

---

## 11. Operaciones (Render API)

Base: `https://api.render.com/v1` — header `Authorization: Bearer $RENDER_API_KEY`.

```bash
# Disparar deploy de un servicio
curl -X POST "https://api.render.com/v1/services/SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d '{"clearCache":"do_not_clear"}'

# Último deploy
curl "https://api.render.com/v1/services/SERVICE_ID/deploys?limit=1" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Logs de runtime
curl "https://api.render.com/v1/logs?ownerId=OWNER_ID&resource=SERVICE_ID&limit=50" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Reemplazar TODAS las env vars (reemplaza el set completo)
curl -X PUT "https://api.render.com/v1/services/SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d @env.json
```

**Rollback:** re-deploy de un commit anterior con
`POST /services/{id}/deploys` y body `{"commitId":"<sha>"}`, o cambiar el CNAME de
Cloudflare a otro host.

---

## 12. Troubleshooting

### Cold start (~30–60 s)

Render free duerme los servicios inactivos y Neon escala a cero. La primera request
tarda; es esperado.

### `502` / `503` en el front-door

`modula-web` proxea a las URLs públicas de los otros servicios. Si `modula-api` o
`modula-payment` están dormidos, la primera request puede fallar — reintentar o
"despertar" el servicio.

### Login admin no funciona

1. Verificar que el admin existe en Neon (seed o `sql/bootstrap-admin.sql`).
2. `QUOTE_TOKEN_SECRET` / `JWT_*` presentes en `modula-api`.
3. Revisar logs: `GET /logs?...&resource=<modula-api-id>`.

### BullMQ no procesa jobs

- `BULL_REDIS_URL` debe ser `rediss://...` (TCP), no el endpoint REST.
- Revisar logs de `modula-api` por errores de conexión a Redis.

### `413 Request Entity Too Large`

El front-door ya setea `client_max_body_size 50m;` en
[`infra/render/nginx.conf.template`](infra/render/nginx.conf.template).

### Webhook PayPal falla

- La URL debe ser exactamente `https://modulapp.artisandevs.site/payments/webhooks/paypal`.
- `PAYPAL_WEBHOOK_ID` debe coincidir con el del dashboard.

### Imágenes rotas

- Verificar que el bucket `SUPABASE_STORAGE_BUCKET` es **público** y que las URLs en
  `proto_images` son absolutas (`https://...supabase.co/storage/v1/object/public/...`).
- Re-subir las de seed con `infra/seed-images/upload.sh`.

---

## Checklist Final

- [ ] `.env` de producción preparado (valores del paso 3)
- [ ] 2 bases Neon + migraciones aplicadas
- [ ] Upstash REST + TCP (`BULL_REDIS_URL`) listos
- [ ] PayPal webhook apuntando al dominio de producción
- [ ] 3 servicios creados en Render con sus env vars
- [ ] Dominio custom `modulapp.artisandevs.site` verified + CNAME DNS-only
- [ ] Secret `RENDER_API_KEY` en GitHub; CI verde
- [ ] Seed corrido (datos de ejemplo) + imágenes subidas al bucket
- [ ] Health check, admin, login y webhook verificados
