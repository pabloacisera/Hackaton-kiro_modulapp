# infra

Docker, Nginx, and Terraform configuration for development and production.

## Structure

```
infra/
├── docker/
│   ├── docker-compose.yml       # Development environment
│   └── docker-compose.prod.yml  # Production environment
├── nginx/
│   └── nginx.conf               # Reverse proxy config
└── terraform/
    ├── main.tf                  # Provider, data sources, VPC
    ├── ec2.tf                   # EC2 instance + Elastic IP
    ├── security-group.tf        # Firewall rules
    ├── iam.tf                   # IAM role + instance profile
    ├── variables.tf             # Configurable inputs
    ├── outputs.tf               # Post-apply information
    ├── user-data.sh             # Instance bootstrap script
    ├── terraform.tfvars.example # Example variable values
    └── .gitignore               # Ignores state + real tfvars
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

```bash
# 1. Provision infrastructure with Terraform
cd infra/terraform
terraform init && terraform apply

# 2. Upload .env to the instance
scp -i ~/.ssh/modula-prod-key.pem .env ec2-user@<IP>:/opt/modula/.env

# 3. Start the app
ssh ec2-user@<IP> "sudo systemctl start modula-app"
```

Full guide: [docs/terraform-guide.md](../docs/terraform-guide.md)

Nginx serves static builds and proxies API requests. Cloudflare Tunnel
provides HTTPS termination externally.

## Environment variables

All services read from `.env` file in the project root (or `/opt/modula/.env` in production).
See `.kiro/steerings/09-environment-variables.md` for details.
