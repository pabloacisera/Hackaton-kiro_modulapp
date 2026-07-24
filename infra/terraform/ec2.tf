# ──────────────────────────────────────────────────────────────────────────────
# EC2 Instance — Runs Docker Compose with all ModulaApp services
# ──────────────────────────────────────────────────────────────────────────────

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_app.name
  vpc_security_group_ids = [aws_security_group.modula_app.id]

  # Use default VPC subnet (Option B). For Option A, use:
  # subnet_id = data.aws_subnets.existing.ids[0]
  subnet_id = data.aws_subnets.default.ids[0]

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    app_repo_url            = var.app_repo_url
    app_branch              = var.app_branch
    cloudflare_tunnel_token = var.cloudflare_tunnel_token
    project_name            = var.project_name
  })

  # Prevent accidental termination in production
  disable_api_termination = var.environment == "production" ? true : false

  metadata_options {
    http_tokens   = "required" # IMDSv2 only (security best practice)
    http_endpoint = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-app"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  lifecycle {
    # Don't destroy and recreate if AMI changes — use in-place updates instead
    ignore_changes = [ami]
  }
}

# ── Elastic IP (optional, recommended for stable DNS) ────────────────────────

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-eip"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
