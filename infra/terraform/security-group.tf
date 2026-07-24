# ──────────────────────────────────────────────────────────────────────────────
# Security Group — Firewall rules for the EC2 instance
# ──────────────────────────────────────────────────────────────────────────────

resource "aws_security_group" "modula_app" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Security group for ModulaApp EC2 instance"

  # Use default VPC (Option B). Switch to data.aws_vpc.existing.id for Option A.
  vpc_id = data.aws_vpc.default.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-sg"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ── Ingress Rules ────────────────────────────────────────────────────────────

# HTTP (port 80) — Cloudflare tunnel connects here
resource "aws_security_group_rule" "http_ingress" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.modula_app.id
  description       = "HTTP - Cloudflare tunnel and health checks"
}

# SSH (port 22) — Restricted to specified CIDRs only
resource "aws_security_group_rule" "ssh_ingress" {
  count = length(var.ssh_allowed_cidrs) > 0 ? 1 : 0

  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.ssh_allowed_cidrs
  security_group_id = aws_security_group.modula_app.id
  description       = "SSH - Restricted to allowed CIDRs"
}

# ── Egress Rules ─────────────────────────────────────────────────────────────

# All outbound traffic (needed for: Docker Hub pulls, apt updates, RDS, Upstash,
# PayPal API, Mailjet, Cloudflare tunnel, Supabase, GitHub)
resource "aws_security_group_rule" "all_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.modula_app.id
  description       = "All outbound traffic"
}

# ── Optional: Allow EC2 to reach RDS Security Group ──────────────────────────
# Uncomment if your RDS uses a security group with source-based rules.

# resource "aws_security_group_rule" "rds_access" {
#   count = var.rds_security_group_id != "" ? 1 : 0
#
#   type                     = "ingress"
#   from_port                = 5432
#   to_port                  = 5432
#   protocol                 = "tcp"
#   source_security_group_id = aws_security_group.modula_app.id
#   security_group_id        = var.rds_security_group_id
#   description              = "Allow EC2 to access RDS PostgreSQL"
# }
