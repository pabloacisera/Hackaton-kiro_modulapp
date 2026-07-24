# ──────────────────────────────────────────────────────────────────────────────
# Terraform — ModulaApp EC2 + Docker Compose deployment
# ──────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ──────────────────────────────────────────────────────────────────────────
  # Remote state (recommended for team work). Uncomment when ready.
  # ──────────────────────────────────────────────────────────────────────────
  # backend "s3" {
  #   bucket         = "modula-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-2"
  #   encrypt        = true
  #   dynamodb_table = "modula-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
}

# ──────────────────────────────────────────────────────────────────────────────
# Data sources
# ──────────────────────────────────────────────────────────────────────────────

# Latest Amazon Linux 2023 AMI (free tier eligible on t2.micro/t3.micro)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ──────────────────────────────────────────────────────────────────────────────
# Option A: Use an EXISTING VPC (e.g., same VPC as your RDS)
# Uncomment this block and comment out Option B if your RDS is in a known VPC.
# ──────────────────────────────────────────────────────────────────────────────
# data "aws_vpc" "existing" {
#   id = var.existing_vpc_id
# }
#
# data "aws_subnets" "existing" {
#   filter {
#     name   = "vpc-id"
#     values = [data.aws_vpc.existing.id]
#   }
#   filter {
#     name   = "map-public-ip-on-launch"
#     values = ["true"]
#   }
# }

# ──────────────────────────────────────────────────────────────────────────────
# Option B: Use the DEFAULT VPC (simpler for getting started)
# Comment this block and uncomment Option A if you need a specific VPC.
# ──────────────────────────────────────────────────────────────────────────────
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
