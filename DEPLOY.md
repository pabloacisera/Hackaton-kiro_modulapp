# Guía de Deploy — ModulaApp

> **IMPORTANTE:** Sigue cada paso en orden. Si omites un paso, el deploy fallará.
> Última actualización: 2026-07-27

---

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Preparar el .env de Producción](#2-preparar-el-env-de-producción)
3. [Configurar PayPal para Producción](#3-configurar-paypal-para-producción)
4. [Configurar Cloudflare Tunnel](#4-configurar-cloudflare-tunnel)
5. [Aplicar Cambios al Código (Pre-Deploy Fixes)](#5-aplicar-cambios-al-código-pre-deploy-fixes)
6. [Crear Key Pair en AWS](#6-crear-key-pair-en-aws)
7. [Provisionar Infraestructura con Terraform](#7-provisionar-infraestructura-con-terraform)
8. [Subir el .env a la Instancia](#8-subir-el-env-a-la-instancia)
9. [Truncar Tablas (Base de Datos Limpia)](#9-truncar-tablas-base-de-datos-limpia)
10. [Insertar Admin Fundador](#10-insertar-admin-fundador)
11. [Iniciar la Aplicación](#11-iniciar-la-aplicación)
12. [Verificar el Deploy](#12-verificar-el-deploy)
13. [Post-Deploy: PayPal Webhook URL](#13-post-deploy-paypal-webhook-url)
14. [Actualizar DNS (si aplica)](#14-actualizar-dns-si-aplica)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Requisitos Previos

Antes de comenzar, necesitas tener instalado y configurado:

```bash
# Terraform
terraform --version  # >= 1.5.0

# AWS CLI
aws --version        # >= 2.x
aws configure        # Con credenciales IAM que tengan EC2, IAM, SSM permisos
#   Region: us-east-2
#   Output: json

# psql (cliente PostgreSQL — para scripts SQL)
psql --version

# Node.js (para generar hash de password)
node --version       # >= 20
```

Verifica acceso a AWS:

```bash
aws sts get-caller-identity
```

Si no ves tu account ID, corrige tus credenciales antes de continuar.

---

## 2. Preparar el .env de Producción

Copia tu `.env` actual y modifica los siguientes valores para producción.
**No subas el .env al repo.** Se transfiere manualmente a la instancia.

### Valores que DEBES cambiar:

```env
# ─── URLs Públicas ─────────────────────────────────────────────────────────
APP_PUBLIC_URL=https://modula.artisandevs.site
VITE_API_URL=/api

# ─── CORS ─────────────────────────────────────────────────────────────────
CORS_ORIGINS=https://modula.artisandevs.site

# ─── Redis (BullMQ — dentro de Docker Compose) ────────────────────────────
# IMPORTANTE: En producción el host es "redis" (nombre del servicio Docker)
REDIS_HOST=redis

# ─── URLs internas entre servicios Docker ──────────────────────────────────
# IMPORTANTE: "payment-service" es el nombre del container, NO localhost
PAYMENT_SERVICE_URL=http://payment-service:8081

# ─── Admin Dashboard URL (para emails de registro) ────────────────────────
ADMIN_DASHBOARD_URL=https://modula.artisandevs.site/admin

# ─── PayPal ───────────────────────────────────────────────────────────────
# Si vas a producción real: cambiar mode a "live" y usar credenciales live
# Si sigues en sandbox, solo cambia la webhook URL:
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_URL=https://modula.artisandevs.site/payments/webhooks/paypal
```

### Valores que DEBEN mantenerse (ya están correctos):

```env
DATABASE_URL=postgresql://...         # Tu RDS de api-core
PAYMENT_DATABASE_URL=postgresql://... # Tu RDS de payment-service
UPSTASH_REDIS_REST_URL=...           # Para cache/rate-limiting
UPSTASH_REDIS_REST_TOKEN=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
QUOTE_ACTION_TOKEN_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...                 # Se actualiza en paso 13
MAILJET_API_KEY=...
MAILJET_API_SECRET=...
MAILJET_FROM_EMAIL=...
MAILJET_FROM_NAME=...
SUPABASE_URL=...
SUPABASE_STORAGE_BUCKET=...
SUPABASE_SERVICE_ROLE_KEY=...
PAYMENT_DB_REGION=us-east-2
```

### Valores que puedes ELIMINAR (no se usan en código):

```env
# API_BASE_URL — no se referencia en ningún archivo del proyecto
# GITHUB_TOKEN — solo para MCP local
# GOOGLE_* — solo para scripts locales de Google Drive
```

### .env final de producción — plantilla completa:

Asegúrate que tu `.env` contenga exactamente estas claves (con tus valores reales):

```env
VITE_API_URL=/api
APP_PUBLIC_URL=https://modula.artisandevs.site
DATABASE_URL=postgresql://USER:PASS@HOST:5432/postgres
PAYMENT_DATABASE_URL=postgresql://USER:PASS@HOST:5432/postgres
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
QUOTE_ACTION_TOKEN_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=...
PAYPAL_WEBHOOK_URL=https://modula.artisandevs.site/payments/webhooks/paypal
PAYMENT_DB_REGION=us-east-2
MAILJET_API_KEY=...
MAILJET_API_SECRET=...
MAILJET_FROM_EMAIL=modulapp1@gmail.com
MAILJET_FROM_NAME=modulapp
WEBHOOK_SHARED_SECRET=...
PAYMENT_SERVICE_URL=http://payment-service:8081
CORS_ORIGINS=https://modula.artisandevs.site
ADMIN_DASHBOARD_URL=https://modula.artisandevs.site/admin
SUPABASE_URL=https://....supabase.co
SUPABASE_STORAGE_BUCKET=modulapp-receipts-dev
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_HOST=redis
```

---

## 3. Configurar PayPal para Producción

### 3.1 Webhook URL (sandbox o live)

1. Ve a https://developer.paypal.com/dashboard/applications
2. Selecciona tu aplicación (sandbox o live)
3. Sección **Webhooks** → Edit/Add webhook
4. **Webhook URL:** `https://modula.artisandevs.site/payments/webhooks/paypal`
5. **Events to subscribe:**
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
6. Guarda y copia el **Webhook ID** que PayPal te da
7. Coloca ese Webhook ID en tu `.env`:
   ```
   PAYPAL_WEBHOOK_ID=<el-nuevo-webhook-id>
   ```

### 3.2 Return URLs

PayPal redirige al usuario a estas URLs después del pago:

- Éxito: `https://modula.artisandevs.site/checkout/success`
- Cancelado: `https://modula.artisandevs.site/checkout/cancel`

Estas URLs se construyen automáticamente desde `APP_PUBLIC_URL` en el código del
payment-service. No necesitas configurar nada extra si `APP_PUBLIC_URL` es correcto.

### 3.3 Si vas a producción real (live)

1. En PayPal Developer → switch a **Live**
2. Crea una app Live o usa la existente
3. Copia Client ID y Secret del modo Live
4. Cambia en `.env`:
   ```
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=<live-client-id>
   PAYPAL_CLIENT_SECRET=<live-secret>
   ```
5. Crea un nuevo webhook Live con la misma URL y eventos
6. Actualiza `PAYPAL_WEBHOOK_ID` con el ID del webhook Live

---

## 4. Configurar Cloudflare Tunnel

El Cloudflare Tunnel conecta tu EC2 a internet con HTTPS sin exponer puertos.

### 4.1 Crear el Tunnel

1. Ve a https://one.dash.cloudflare.com → **Networks** → **Tunnels**
2. Click **Create a tunnel**
3. Nombre: `modula-production`
4. En la pantalla de instalación, copia el **token** (cadena larga que empieza con `eyJ...`)
5. Guarda este token — lo usarás en `terraform.tfvars`

### 4.2 Configurar el Public Hostname

En la configuración del tunnel, agrega un **Public Hostname**:

| Campo     | Valor                            |
| --------- | -------------------------------- |
| Subdomain | (vacío o `www` según tu dominio) |
| Domain    | `modula.artisandevs.site`        |
| Type      | HTTP                             |
| URL       | `localhost:80`                   |

Esto le dice a Cloudflare: "todo el tráfico HTTPS de `modula.artisandevs.site`
debe reenviarse al puerto 80 de la instancia EC2 donde corre Nginx."

### 4.3 Verificar DNS

En **Cloudflare DNS** para tu dominio, debe existir un registro CNAME:

- **Name:** `@` (o `modula` según tu setup)
- **Target:** `<tunnel-id>.cfargotunnel.com`
- **Proxied:** ✓ (nube naranja)

---

## 5. Aplicar Cambios al Código (Pre-Deploy Fixes)

Antes de deployar, los siguientes archivos necesitan cambios. Estos se detallan
en el plan de acción y deben estar commiteados en la rama de deploy:

### 5.1 `infra/docker/docker-compose.prod.yml`

Agregar:

- Servicio `redis` (sin puertos expuestos, solo red interna)
- Variables `REDIS_HOST=redis`, `REDIS_PORT=6379` en `api-core`
- Variable `PAYMENT_SERVICE_URL=http://payment-service:8081` en `api-core`
- `depends_on: redis` en `api-core`
- Volumen `redis-data`

### 5.2 `infra/nginx/nginx.conf`

Agregar en el bloque `http {}`:

```nginx
client_max_body_size 50m;
```

### 5.3 `.env.example`

Regenerar como esqueleto exacto del `.env` real (sin credenciales).

### 5.4 Código de api-core (límite de upload)

- Subir `MAX_FILE_SIZE` de 5MB a 50MB en `admin-catalog.controller.ts`
- O crear constantes separadas para imágenes (5MB) y documentos (50MB)

> **NOTA:** Estos cambios se implementan en el paso del plan de acción.
> Si ya los aplicaste, continúa al paso 6.

---

## 6. Crear Key Pair en AWS

Si no lo tienes ya:

1. AWS Console → **EC2** → **Key Pairs** → **Create Key Pair**
2. Configuración:
   - Name: `modula-prod-key`
   - Type: RSA
   - Format: `.pem`
3. Descarga el archivo y guárdalo:

```bash
mv ~/Downloads/modula-prod-key.pem ~/.ssh/modula-prod-key.pem
chmod 400 ~/.ssh/modula-prod-key.pem
```

---

## 7. Provisionar Infraestructura con Terraform

### 7.1 Crear `terraform.tfvars`

```bash
cd infra/terraform
```

Crea el archivo `terraform.tfvars`:

```hcl
key_pair_name           = "modula-prod-key"
ssh_allowed_cidrs       = ["TU_IP_PUBLICA/32"]  # Ejecuta: curl -s ifconfig.me
app_repo_url            = "https://github.com/TU_USER/Hackaton-kiro_modulapp.git"
app_branch              = "main"
cloudflare_tunnel_token = "eyJ..."  # Del paso 4.1
instance_type           = "t3.small"
root_volume_size        = 30
```

Para obtener tu IP pública:

```bash
curl -s ifconfig.me
# Resultado ejemplo: 181.47.102.55
# Entonces: ssh_allowed_cidrs = ["181.47.102.55/32"]
```

### 7.2 Inicializar Terraform

```bash
terraform init
```

Espera: `Terraform has been successfully initialized!`

### 7.3 Verificar el plan

```bash
terraform plan
```

Deberías ver: `Plan: 8 to add, 0 to change, 0 to destroy.`

Recursos que se crean:

- 1 EC2 instance (t3.small)
- 1 Elastic IP
- 1 Security Group + 3 rules
- 1 IAM Role + policy + instance profile

### 7.4 Aplicar

```bash
terraform apply
```

Escribe `yes` cuando pida confirmación. Espera ~2-3 minutos.

Guarda los outputs:

```
public_ip   = "X.X.X.X"
instance_id = "i-0abc..."
ssh_command = "ssh -i ~/.ssh/modula-prod-key.pem ec2-user@X.X.X.X"
```

### 7.5 Esperar bootstrap

El `user-data.sh` se ejecuta en background después del lanzamiento.
Espera ~3-5 minutos para que instale Docker, Docker Compose y clone el repo.

Verifica que terminó:

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP> "tail -5 /var/log/user-data.log"
```

Debes ver: `✓ Bootstrap complete!`

---

## 8. Subir el .env a la Instancia

```bash
scp -i ~/.ssh/modula-prod-key.pem .env ec2-user@<IP>:/opt/modula/.env
```

Verifica que se subió correctamente:

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP> "head -3 /opt/modula/.env"
```

---

## 9. Truncar Tablas (Base de Datos Limpia)

Ejecuta estos scripts contra tus bases de datos RDS para empezar de cero.

### 9.1 Base de datos api-core

```bash
psql "postgresql://modulappuser:PASSWORD@db-modulapp.c7yc8qiw01pj.us-east-2.rds.amazonaws.com:5432/postgres" << 'EOF'

-- Desactivar restricciones temporalmente
SET session_replication_role = replica;

-- Truncar todas las tablas (orden no importa con replica role)
TRUNCATE TABLE admin_notifications CASCADE;
TRUNCATE TABLE low_stock_alert_state CASCADE;
TRUNCATE TABLE supply_stock_change_log CASCADE;
TRUNCATE TABLE supplies CASCADE;
TRUNCATE TABLE complaints CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE proto_images CASCADE;
TRUNCATE TABLE prototypes CASCADE;
TRUNCATE TABLE refresh_tokens CASCADE;
TRUNCATE TABLE admin_users CASCADE;

-- Reactivar restricciones
SET session_replication_role = DEFAULT;

-- Verificar que quedó vacío
SELECT 'admin_users' as t, count(*) FROM admin_users
UNION ALL SELECT 'prototypes', count(*) FROM prototypes
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'quotes', count(*) FROM quotes;

EOF
```

### 9.2 Base de datos payment-service

```bash
psql "postgresql://modulappuserpay:PASSWORD@db-modulapp-payment.c7yc8qiw01pj.us-east-2.rds.amazonaws.com:5432/postgres" << 'EOF'

SET session_replication_role = replica;

TRUNCATE TABLE receipts CASCADE;
TRUNCATE TABLE refunds CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

SET session_replication_role = DEFAULT;

-- Verificar
SELECT 'payments' as t, count(*) FROM payments
UNION ALL SELECT 'refunds', count(*) FROM refunds
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs;

EOF
```

> **NOTA:** Las migraciones de Prisma y Flyway ya están aplicadas (tablas y
> enums existen). Solo limpiamos los datos, no el schema.

---

## 10. Insertar Admin Fundador

Sin este paso, no podrás acceder al admin dashboard ni crear otros administradores.

### 10.1 Generar el hash del password

En tu máquina local (donde tengas node_modules):

```bash
cd apps/api-core
node -e "const argon2 = require('argon2'); argon2.hash('TU_PASSWORD_SEGURO_AQUI').then(h => console.log(h))"
```

Copia el hash resultante (empieza con `$argon2id$v=19$...`).

### 10.2 Insertar en la base de datos

```bash
psql "postgresql://modulappuser:PASSWORD@db-modulapp.c7yc8qiw01pj.us-east-2.rds.amazonaws.com:5432/postgres" << 'EOF'

INSERT INTO admin_users (id, email, password_hash, active, created_at)
VALUES (
  gen_random_uuid(),
  'admin@modulapp.com',
  '$argon2id$v=19$m=65536,t=3,p=4$...TU_HASH_AQUI...',
  true,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar
SELECT id, email, active, created_at FROM admin_users;

EOF
```

### 10.3 Verificar que funciona

Una vez la app esté arriba (paso 11), prueba login en:
`https://modula.artisandevs.site/admin` con:

- Email: `admin@modulapp.com`
- Password: el que elegiste

Este admin puede luego generar **invite codes** para crear más administradores
desde Settings → Generate Invite Code.

---

## 11. Iniciar la Aplicación

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP>
```

Dentro de la instancia:

```bash
sudo systemctl start modula-app
```

Esto ejecuta `docker compose -f infra/docker/docker-compose.prod.yml up -d --build`.

La primera vez tarda **5-10 minutos** porque:

- Descarga imágenes base de Docker Hub
- Compila el frontend (Vite build)
- Compila el backend (NestJS build + Prisma generate)
- Compila payment-service (Maven build)

### Monitorear el progreso:

```bash
# Ver el status del systemd service
sudo systemctl status modula-app

# Ver logs de build en tiempo real
cd /opt/modula
sudo docker compose -f infra/docker/docker-compose.prod.yml logs -f

# Ver solo un servicio específico
sudo docker compose -f infra/docker/docker-compose.prod.yml logs -f api-core
sudo docker compose -f infra/docker/docker-compose.prod.yml logs -f payment-service
```

### Esperar a que todos los servicios estén healthy:

```bash
sudo docker compose -f infra/docker/docker-compose.prod.yml ps
```

Todos deben mostrar status `Up (healthy)`:

```
NAME                STATUS
nginx               Up (healthy)
api-core            Up (healthy)
payment-service     Up (healthy)
redis               Up (healthy)
landing             Up
admin-dashboard     Up
```

---

## 12. Verificar el Deploy

### 12.1 Health check directo (Elastic IP)

```bash
curl http://<IP>/health
# Esperado: {"status":"ok"}
```

### 12.2 Health check vía dominio (Cloudflare Tunnel)

```bash
curl https://modula.artisandevs.site/health
# Esperado: {"status":"ok"}
```

### 12.3 Verificar cada servicio

```bash
# Landing (homepage)
curl -s -o /dev/null -w "%{http_code}" https://modula.artisandevs.site/
# Esperado: 200

# Admin dashboard
curl -s -o /dev/null -w "%{http_code}" https://modula.artisandevs.site/admin/
# Esperado: 200

# API Core
curl https://modula.artisandevs.site/api/health
# Esperado: {"status":"ok"}

# Payment service
curl https://modula.artisandevs.site/payments/health
# Esperado: 200 o {"status":"UP"}
```

### 12.4 Verificar Redis (BullMQ queues)

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP>
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml exec redis redis-cli PING
# Esperado: PONG
```

### 12.5 Verificar conexión a RDS

Busca en los logs de api-core:

```bash
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml logs api-core | grep -i "prisma\|database\|connected"
```

---

## 13. Post-Deploy: PayPal Webhook URL

Si creaste el webhook ANTES de tener la URL de producción funcionando, PayPal
puede haber fallado en la verificación. Verifica:

1. Ve a https://developer.paypal.com/dashboard/applications → tu app
2. **Webhooks** → verifica que el URL es:
   ```
   https://modula.artisandevs.site/payments/webhooks/paypal
   ```
3. Haz click en **Test** (simulador) para verificar que el endpoint responde
4. Si el test falla, revisa:
   ```bash
   sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml logs payment-service | grep -i webhook
   ```

### Verificar que el PAYPAL_WEBHOOK_ID en tu .env coincide con el webhook ID en PayPal Dashboard.

Si cambiaste el webhook o creaste uno nuevo, actualiza el `.env` en el servidor:

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP>
sudo nano /opt/modula/.env
# Editar PAYPAL_WEBHOOK_ID=<nuevo-id>
# Guardar y reiniciar:
sudo systemctl restart modula-app
```

---

## 14. Actualizar DNS (si aplica)

Si tu dominio NO está en Cloudflare (o tienes DNS externo):

| Tipo  | Nombre   | Valor                          | TTL  |
| ----- | -------- | ------------------------------ | ---- |
| CNAME | `modula` | `<tunnel-id>.cfargotunnel.com` | Auto |

O si usas Elastic IP directamente (sin Cloudflare Tunnel):

| Tipo | Nombre   | Valor          | TTL |
| ---- | -------- | -------------- | --- |
| A    | `modula` | `<Elastic IP>` | 300 |

---

## 15. Troubleshooting

### La app no arranca

```bash
# Ver qué falló
sudo systemctl status modula-app
sudo journalctl -u modula-app --no-pager -n 50

# Ver logs de Docker Compose build
cd /opt/modula
sudo docker compose -f infra/docker/docker-compose.prod.yml logs --tail=100
```

### api-core crashea al iniciar

Causas comunes:

- `DATABASE_URL` incorrecto → `Error: P1001: Can't reach database server`
- Redis no disponible → BullMQ connection error (verificar que el servicio redis está corriendo)
- `.env` no cargado → `JWT_ACCESS_SECRET is undefined`

```bash
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml logs api-core | tail -30
```

### payment-service no conecta a RDS

Verifica que el Security Group de RDS permite conexiones desde la IP del EC2.
La IP es la Elastic IP del output de Terraform.

En AWS Console → RDS → tu instancia → Security Group → Inbound Rules:

- Type: PostgreSQL
- Port: 5432
- Source: `<Elastic IP>/32` o el Security Group del EC2

### 413 Request Entity Too Large

Si ves este error al subir archivos, significa que nginx rechaza el body.
Verifica que `client_max_body_size 50m;` está en `infra/nginx/nginx.conf`.

```bash
# Dentro del EC2:
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml exec nginx cat /etc/nginx/nginx.conf | grep client_max
```

### Cloudflare Tunnel no conecta

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared --no-pager -n 20
```

Si muestra `ERR  error="connection refused"`:

- Nginx no está escuchando en puerto 80
- Verificar: `curl http://localhost/health` dentro del EC2

### No puedo hacer login en admin

1. Verificar que insertaste el admin en el paso 10
2. Verificar que el hash es correcto (regenerar si dudas)
3. Verificar que las cookies secure funcionan (necesitas HTTPS via Cloudflare)
4. Revisar logs: `docker compose logs api-core | grep -i "login\|auth\|401"`

### Redis "Connection refused"

```bash
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml ps redis
# Si no está corriendo:
sudo docker compose -f /opt/modula/infra/docker/docker-compose.prod.yml up -d redis
```

---

## Resumen de Arquitectura en Producción

```
Internet
   │
   ▼
Cloudflare (HTTPS + DDoS + CDN)
   │
   │ Tunnel (HTTP :80)
   ▼
┌────────────────────────────────────────────────────┐
│  EC2 (t3.small — us-east-2)                        │
│                                                    │
│  ┌─── Docker Compose ───────────────────────────┐  │
│  │                                              │  │
│  │  nginx:80 ─┬─ / ──────→ landing:80          │  │
│  │            ├─ /admin/ ─→ admin-dashboard:80  │  │
│  │            ├─ /api/ ───→ api-core:8080       │  │
│  │            └─ /payments/→ payment-svc:8081   │  │
│  │                                              │  │
│  │  api-core ───→ redis:6379 (BullMQ)           │  │
│  │          ───→ Upstash (cache/rate-limit)     │  │
│  │          ───→ RDS PostgreSQL (api-core DB)   │  │
│  │          ───→ Supabase Storage (files)       │  │
│  │                                              │  │
│  │  payment-service ──→ RDS (payment DB)        │  │
│  │                  ──→ PayPal API              │  │
│  │                  ──→ api-core:8080 (webhook) │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

Servicios Externos:
  • RDS PostgreSQL (2 instancias — us-east-2)
  • Upstash Redis (REST — cache + rate limiting)
  • Supabase Storage (archivos/PDFs)
  • PayPal API (sandbox/live)
  • Mailjet (emails transaccionales)
  • Cloudflare (DNS + HTTPS + Tunnel)
```

---

## Checklist Final

- [ ] `.env` con valores de producción preparado
- [ ] PayPal webhook apuntando a URL de producción
- [ ] Cloudflare Tunnel creado y configurado
- [ ] Cambios de código commiteados (redis en prod compose, nginx 50mb, etc.)
- [ ] Key Pair creado en AWS
- [ ] `terraform apply` ejecutado exitosamente
- [ ] `.env` subido a `/opt/modula/.env`
- [ ] Tablas truncadas (api-core DB + payment DB)
- [ ] Admin fundador insertado en `admin_users`
- [ ] `systemctl start modula-app` ejecutado
- [ ] Health check responde OK
- [ ] Login de admin funciona
- [ ] PayPal webhook test pasó
- [ ] Security Group de RDS permite la IP del EC2
