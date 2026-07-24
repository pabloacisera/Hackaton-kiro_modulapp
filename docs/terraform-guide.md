# Terraform Guide — Step by Step for Developers

> This guide assumes you have ZERO experience with Terraform.
> It covers everything from installation to destroying the infrastructure.

## What is Terraform?

Terraform is an **Infrastructure as Code (IaC)** tool. Instead of clicking around
in the AWS Console to create servers, you write `.tf` files that describe WHAT you
want, and Terraform figures out HOW to create it.

**Key concepts:**

| Concept   | What it means                                                  |
| --------- | -------------------------------------------------------------- |
| Provider  | The cloud platform (AWS, GCP, Azure). We use AWS.              |
| Resource  | A thing Terraform manages (EC2 instance, security group, etc.) |
| State     | Terraform's memory of what it has created (`.tfstate` file)    |
| Plan      | A preview of what Terraform WILL do (create, modify, destroy)  |
| Apply     | Actually execute the plan (create/modify real resources)       |
| Destroy   | Delete everything Terraform created                            |
| Variables | Configurable inputs (instance size, region, etc.)              |
| Outputs   | Information Terraform returns after apply (IP address, etc.)   |

## Prerequisites

### 1. Install Terraform

```bash
# Ubuntu/Debian
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# macOS
brew install terraform

# Verify
terraform --version
```

### 2. Install AWS CLI

```bash
# If not already installed
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

### 3. Configure AWS credentials

```bash
aws configure
# Enter:
#   AWS Access Key ID: (from IAM user)
#   AWS Secret Access Key: (from IAM user)
#   Default region: us-east-2
#   Output format: json
```

Your IAM user needs these permissions (or use AdministratorAccess for dev):

- `ec2:*`
- `iam:*`
- `ssm:*`

### 4. Create an SSH Key Pair in AWS

Go to: **AWS Console → EC2 → Key Pairs → Create Key Pair**

- Name: `modula-prod-key`
- Type: RSA
- Format: `.pem`
- Download and save to `~/.ssh/modula-prod-key.pem`

```bash
chmod 400 ~/.ssh/modula-prod-key.pem
```

## Step-by-Step Deployment

### Step 1: Navigate to Terraform directory

```bash
cd infra/terraform
```

### Step 2: Create your variables file

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your real values:

```hcl
key_pair_name     = "modula-prod-key"
ssh_allowed_cidrs = ["YOUR_PUBLIC_IP/32"]  # Find with: curl ifconfig.me
app_repo_url      = "https://github.com/YOUR_USER/Hackaton-kiro_modulapp.git"
cloudflare_tunnel_token = "eyJhIjoiYWJj..."  # From Cloudflare dashboard
```

### Step 3: Initialize Terraform

```bash
terraform init
```

This downloads the AWS provider plugin. You only need to run it once (or when
you change providers).

**Expected output:**

```
Terraform has been successfully initialized!
```

### Step 4: Preview the changes (Plan)

```bash
terraform plan
```

This shows you EXACTLY what Terraform will create. Nothing is created yet.
Review it carefully. You should see:

- 1 EC2 instance
- 1 Security Group + rules
- 1 IAM Role + policies + instance profile
- 1 Elastic IP

**Expected output:**

```
Plan: 8 to add, 0 to change, 0 to destroy.
```

### Step 5: Create the infrastructure (Apply)

```bash
terraform apply
```

Terraform will show the plan again and ask for confirmation:

```
Do you want to perform these actions?
  Enter a value: yes
```

Type `yes` and press Enter. Wait ~2 minutes.

**Expected output:**

```
Apply complete! Resources: 8 added, 0 changed, 0 destroyed.

Outputs:

instance_id = "i-0abc123def456..."
public_ip = "3.145.67.89"
ssh_command = "ssh -i ~/.ssh/modula-prod-key.pem ec2-user@3.145.67.89"
ssm_command = "aws ssm start-session --target i-0abc123def456... --region us-east-2"
```

### Step 6: Upload the .env file

The instance is running but the app is NOT started yet (needs `.env`).

```bash
# Option A: SCP (if SSH is enabled)
scp -i ~/.ssh/modula-prod-key.pem .env ec2-user@<PUBLIC_IP>:/opt/modula/.env

# Option B: SSM + copy-paste (no SSH key needed)
aws ssm start-session --target <INSTANCE_ID> --region us-east-2
# Then inside the session:
sudo nano /opt/modula/.env
# Paste your .env content, save, exit
```

### Step 7: Start the application

```bash
# SSH or SSM into the instance, then:
sudo systemctl start modula-app
```

Or manually:

```bash
cd /opt/modula
sudo docker compose -f infra/docker/docker-compose.prod.yml up --build -d
```

### Step 8: Verify

```bash
curl http://<PUBLIC_IP>/health
# Should return: {"status":"ok"}
```

If Cloudflare Tunnel is configured, also test:

```bash
curl https://your-domain.com/health
```

## Common Operations

### Check instance status

```bash
terraform output            # See all outputs
terraform output public_ip  # Just the IP
```

### Update infrastructure (e.g., change instance type)

```bash
# Edit terraform.tfvars:
instance_type = "t3.medium"

# Preview changes:
terraform plan

# Apply:
terraform apply
```

### Redeploy the application (new code, same infra)

Terraform does NOT deploy code — it manages infrastructure. To update the app:

```bash
# SSH into the instance
ssh -i ~/.ssh/modula-prod-key.pem ec2-user@$(terraform output -raw public_ip)

# Pull latest code and rebuild
cd /opt/modula
git pull origin main
sudo docker compose -f infra/docker/docker-compose.prod.yml up --build -d
```

### Destroy everything (tear down)

```bash
terraform destroy
```

⚠️ This deletes the EC2 instance, security group, IAM role, and Elastic IP.
Your data in RDS and Upstash is NOT affected (they're external services).

### View what Terraform is managing

```bash
terraform state list
```

## Troubleshooting

### "Error: No valid credential sources found"

```bash
aws configure  # Re-enter your credentials
# Or check: cat ~/.aws/credentials
```

### "Error: key_pair_name not found"

The key pair must exist in AWS before running `terraform apply`.
Create it in: AWS Console → EC2 → Key Pairs.

### App won't start

```bash
# Check cloud-init logs (bootstrap script):
cat /var/log/user-data.log

# Check Docker Compose logs:
cd /opt/modula
docker compose -f infra/docker/docker-compose.prod.yml logs

# Check if .env is populated:
cat /opt/modula/.env | head -5
```

### Instance is running but can't connect

1. Check security group allows your IP for SSH (port 22)
2. Alternative: Use SSM (no port 22 needed): `aws ssm start-session --target <ID>`
3. Verify instance is in "running" state: `aws ec2 describe-instance-status --instance-ids <ID>`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  Tunnel (HTTPS termination + DDoS protection) │   │
│  └──────────────────────┬───────────────────────┘   │
└─────────────────────────┼───────────────────────────┘
                          │ HTTP :80
┌─────────────────────────┼───────────────────────────┐
│  EC2 Instance (t3.small)│                            │
│  ┌──────────────────────▼───────────────────────┐   │
│  │              Nginx (port 80)                   │   │
│  │  /       → landing (static)                   │   │
│  │  /admin/ → admin-dashboard (static)           │   │
│  │  /api/   → api-core:8080                      │   │
│  │  /payments/ → payment-service:8081            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │  api-core   │  │   payment-service (Java)     │  │
│  │  (NestJS)   │  │   (Spring Boot)              │  │
│  └──────┬──────┘  └─────────────┬────────────────┘  │
└─────────┼────────────────────────┼──────────────────┘
          │                        │
          ▼                        ▼
┌────────────────┐    ┌────────────────────────┐
│  AWS RDS       │    │  Upstash Redis         │
│  (PostgreSQL)  │    │  (Cache + BullMQ)      │
│  IAM Auth      │    │                        │
└────────────────┘    └────────────────────────┘
          │
          ▼
┌────────────────┐    ┌────────────────────────┐
│  PayPal API    │    │  Mailjet               │
│  (Payments)    │    │  (Transactional email) │
└────────────────┘    └────────────────────────┘
```

## Cost Estimate

| Resource                            | Monthly cost (approx) |
| ----------------------------------- | --------------------- |
| EC2 t3.small (on-demand, us-east-2) | ~$15                  |
| EBS 30 GB gp3                       | ~$2.40                |
| Elastic IP (while attached)         | $0                    |
| Data transfer (first 100 GB)        | ~$9                   |
| **Total**                           | **~$26/month**        |

Tips to reduce cost:

- Use a Reserved Instance (1yr) for ~40% savings
- Use Spot Instance for non-production environments
- t3.micro ($7.50/mo) works if you don't build on the instance (use ECR instead)

## Files Reference

```
infra/terraform/
├── main.tf                   # Provider, data sources, VPC config
├── ec2.tf                    # EC2 instance + Elastic IP
├── security-group.tf         # Firewall rules
├── iam.tf                    # IAM role + instance profile
├── variables.tf              # All configurable inputs
├── outputs.tf                # Useful info after apply
├── user-data.sh              # Bootstrap script (runs on first boot)
├── terraform.tfvars.example  # Example values (copy to terraform.tfvars)
└── .gitignore                # Ignores state, real tfvars, .terraform/
```
