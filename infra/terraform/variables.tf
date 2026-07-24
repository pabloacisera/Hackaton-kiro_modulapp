# ──────────────────────────────────────────────────────────────────────────────
# Variables — All configurable inputs for the infrastructure
# ──────────────────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region where all resources will be created"
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name used for resource naming and tagging"
  type        = string
  default     = "modula"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

# ── EC2 Configuration ────────────────────────────────────────────────────────

variable "instance_type" {
  description = "EC2 instance type. t3.small is minimum recommended for 4 containers + build"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of an existing AWS key pair for SSH access. Create one in the AWS console first."
  type        = string
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB. Needs space for Docker images + builds"
  type        = number
  default     = 30
}

# ── Network Configuration ────────────────────────────────────────────────────

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH into the instance. Use your IP/32 for security."
  type        = list(string)
  default     = [] # Empty = SSH disabled. Add your IP like ["203.0.113.5/32"]
}

# Uncomment if using Option A (existing VPC):
# variable "existing_vpc_id" {
#   description = "ID of existing VPC (e.g., where RDS lives)"
#   type        = string
# }

# ── Application Configuration ────────────────────────────────────────────────

variable "app_repo_url" {
  description = "Git repository URL to clone on the instance"
  type        = string
  default     = ""
}

variable "app_branch" {
  description = "Git branch to checkout"
  type        = string
  default     = "main"
}

variable "cloudflare_tunnel_token" {
  description = "Cloudflare Tunnel token for reverse tunnel. Leave empty to skip tunnel setup."
  type        = string
  default     = ""
  sensitive   = true
}

# ── RDS connectivity (for Security Group rules) ──────────────────────────────

variable "rds_security_group_id" {
  description = "Security group ID of RDS instance to allow EC2 access. Leave empty if RDS allows by CIDR."
  type        = string
  default     = ""
}
