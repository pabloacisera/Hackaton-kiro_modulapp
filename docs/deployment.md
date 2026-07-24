# Deployment Guide

> Complete guide for deploying ModulaApp to production on AWS.

## Deployment Architecture

ModulaApp runs as a set of Docker containers on a single EC2 instance, behind
Cloudflare Tunnel for HTTPS termination and DDoS protection.

| Component                     | Where it runs                                |
| ----------------------------- | -------------------------------------------- |
| Landing (React)               | EC2 — Docker container (nginx serves static) |
| Admin Dashboard (React)       | EC2 — Docker container (nginx serves static) |
| API Core (NestJS)             | EC2 — Docker container                       |
| Payment Service (Spring Boot) | EC2 — Docker container                       |
| Nginx (reverse proxy)         | EC2 — Docker container                       |
| PostgreSQL                    | AWS RDS (external, IAM auth)                 |
| Redis                         | Upstash (external)                           |
| HTTPS / CDN                   | Cloudflare Tunnel                            |
| Email                         | Mailjet (external)                           |
| Payments                      | PayPal API (external)                        |

## Prerequisites

Before deploying, you need:

1. **AWS account** with IAM user that has EC2/IAM/SSM permissions
2. **Terraform** installed locally (see [terraform-guide.md](terraform-guide.md))
3. **Cloudflare account** with a tunnel configured
4. **All external services ready**: RDS instance, Upstash Redis, PayPal app, Mailjet account
5. **Complete `.env` file** with all production values

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Developer Machine                                                │
│                                                                  │
│  1. terraform apply     →  Creates EC2, SG, IAM, EIP           │
│  2. scp .env            →  Uploads secrets to instance          │
│  3. ssh → systemctl start → Builds & starts all containers     │
│                                                                  │
│ After first deploy, updates are:                                 │
│  ssh → git pull → docker compose up --build -d                  │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step First Deployment

### 1. Provision Infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan    # Review
terraform apply   # Create resources (type "yes")
```

Save the outputs (IP, instance ID).

### 2. Configure Cloudflare Tunnel

1. Go to **Cloudflare Dashboard → Zero Trust → Networks → Tunnels**
2. Create a new tunnel (or use existing one)
3. Add a public hostname rule:
   - Domain: `your-domain.com`
   - Service: `http://localhost:80`
4. Copy the tunnel token
5. Put it in `terraform.tfvars` as `cloudflare_tunnel_token`
6. Re-run `terraform apply` (updates user-data, but for existing instances
   you'll need to install manually — see below)

**If the instance already exists:**

```bash
# SSH into the instance
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP>

# Install cloudflared manually
sudo curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
sudo cloudflared service install <YOUR_TUNNEL_TOKEN>
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 3. Upload .env File

```bash
# From your local machine (project root):
scp -i ~/.ssh/modula-prod-key.pem .env ec2-user@<IP>:/opt/modula/.env
```

**Critical**: Ensure these production values are set:

- `DATABASE_URL` / `PAYMENT_DATABASE_URL` → RDS endpoint
- `UPSTASH_REDIS_URL` → production Redis
- `PAYPAL_MODE=live` (or keep `sandbox` for testing)
- `APP_PUBLIC_URL=https://your-domain.com`
- `CORS_ORIGINS=https://your-domain.com`
- `VITE_API_URL=https://your-domain.com/api`

### 4. Start the Application

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@<IP>

# Start all services
sudo systemctl start modula-app

# Or manually:
cd /opt/modula
sudo docker compose -f infra/docker/docker-compose.prod.yml up --build -d
```

First build takes 5-10 minutes (downloading base images + building).

### 5. Verify

```bash
# From the instance:
curl http://localhost/health

# From your machine (via Cloudflare):
curl https://your-domain.com/health
curl https://your-domain.com/payments/health
```

## Updating the Application (Subsequent Deploys)

```bash
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@$(cd infra/terraform && terraform output -raw public_ip)

cd /opt/modula
git pull origin main
sudo docker compose -f infra/docker/docker-compose.prod.yml up --build -d
```

For zero-downtime (rolling) updates, build first, then swap:

```bash
sudo docker compose -f infra/docker/docker-compose.prod.yml build
sudo docker compose -f infra/docker/docker-compose.prod.yml up -d
```

## Environment Separation

| Environment | Infrastructure             | Database         | Redis        | Domain          |
| ----------- | -------------------------- | ---------------- | ------------ | --------------- |
| Development | Local (docker-compose.yml) | Local or RDS dev | Upstash dev  | localhost       |
| Production  | EC2 via Terraform          | RDS prod         | Upstash prod | your-domain.com |

## Monitoring & Logs

### Application Logs

```bash
# All services
docker compose -f infra/docker/docker-compose.prod.yml logs -f

# Specific service
docker compose -f infra/docker/docker-compose.prod.yml logs -f api-core
docker compose -f infra/docker/docker-compose.prod.yml logs -f payment-service
```

### System Logs

```bash
# Cloud-init bootstrap log
cat /var/log/user-data.log

# Cloudflare Tunnel
journalctl -u cloudflared -f

# Docker Compose systemd service
journalctl -u modula-app -f
```

### Health Checks

The Nginx health endpoint aggregates service health:

- `GET /health` → api-core health
- `GET /payments/health` → payment-service health (via proxy)

## Disaster Recovery

### Instance dies / needs replacement

```bash
# Terraform recreates everything:
terraform destroy  # Remove old
terraform apply    # Create new

# Then re-upload .env and start the app
```

RDS data is safe (it's external). Only the EC2 instance is ephemeral.

### Rollback a bad deploy

```bash
ssh ec2-user@<IP>
cd /opt/modula
git log --oneline -5          # Find the last good commit
git checkout <good-commit>
sudo docker compose -f infra/docker/docker-compose.prod.yml up --build -d
```

## Security Checklist

- [ ] SSH restricted to your IP only (or disabled, using SSM)
- [ ] `.env` never committed to git
- [ ] `terraform.tfvars` never committed to git
- [ ] IMDSv2 enforced (set in ec2.tf)
- [ ] EBS volume encrypted
- [ ] RDS uses IAM auth (no static password in production)
- [ ] `PAYPAL_MODE=live` only when ready for real transactions
- [ ] Cloudflare WAF rules active
- [ ] Production branch protection enabled on GitHub
