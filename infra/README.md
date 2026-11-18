# infra

Docker, Nginx and deployment configuration for development and production.

## Structure

```
infra/
├── docker/
│   ├── docker-compose.yml       # Development environment
│   └── docker-compose.prod.yml  # Production environment (self-hosted / VPS)
├── nginx/
│   └── nginx.conf               # Reverse proxy config (self-hosted)
├── render/
│   ├── Dockerfile.web           # Front-door web service for Render free tier
│   └── nginx.conf.template      # Nginx template (envsubst: $PORT/$API_CORE_URL/$PAYMENT_URL)
├── seed-images/
│   ├── *.jpg                    # Source images for seeded catalog items
│   └── upload.sh                # Uploads them to the Supabase bucket (idempotent)
└── terraform/                   # ⚠️ LEGACY (AWS, no longer used) — reference only
    ├── main.tf                  # Provider, data sources, VPC
    ├── ec2.tf                   # EC2 instance + Elastic IP
    ├── security-group.tf        # Firewall rules
    ├── iam.tf                   # IAM role + instance profile
    ├── variables.tf             # Configurable inputs
    ├── outputs.tf               # Post-apply information
    ├── user-data.sh             # Instance bootstrap script
    └── terraform.tfvars.example # Example variable values
```

## Development

```bash
bash scripts/dev-up.sh
```

Starts all services locally:

- Landing: http://localhost:3000
- Admin dashboard: http://localhost:3001
- API core: http://localhost:8080
- Payment service: http://localhost:8081

## Production

ModulaApp runs on **Render (free tier)** as three web services. A single front-door
service (`modula-web`, built from `infra/render/Dockerfile.web`) serves the static
frontends and reverse-proxies `/api`, `/socket.io`, `/health` and `/payments` to the
**public** URLs of `modula-api` and `modula-payment`.

| Service          | Dockerfile                        | Context                |
| ---------------- | --------------------------------- | ---------------------- |
| `modula-api`     | `apps/api-core/Dockerfile`        | `.` (repo root)        |
| `modula-payment` | `apps/payment-service/Dockerfile` | `apps/payment-service` |
| `modula-web`     | `infra/render/Dockerfile.web`     | `.` (repo root)        |

Deploys are **CI-gated**: the `deploy` job in `.github/workflows/ci.yml` triggers Render
deploys only after `lint-test-build` passes on a push to `main`.

Full guide: [../DEPLOY.md](../DEPLOY.md) · [docs/deployment.md](../docs/deployment.md)

### Self-hosted alternative (VPS)

`infra/docker/docker-compose.prod.yml` + `infra/nginx/nginx.conf` still describe a
single-host Docker Compose deployment (Nginx + Cloudflare Tunnel). Useful for a VPS, but
**not** the current production setup.

### Legacy (AWS)

`infra/terraform/` is **historical** — the AWS account was lost and this path is no
longer used. Kept for reference only. See [docs/terraform-guide.md](../docs/terraform-guide.md).

## Seed images

`infra/seed-images/` holds the source JPEGs referenced by the seed for demo catalog
items. Upload them to the Supabase bucket once per environment:

```bash
./infra/seed-images/upload.sh   # idempotent (x-upsert)
```

## Environment variables

All services read env vars from the platform (Render) or a local `.env` file in the
project root. See `.kiro/steerings/09-environment-variables.md` for details.
