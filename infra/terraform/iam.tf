# ──────────────────────────────────────────────────────────────────────────────
# IAM — Instance profile for EC2
# Permissions: RDS IAM auth + SSM Session Manager (optional SSH alternative)
# ──────────────────────────────────────────────────────────────────────────────

resource "aws_iam_role" "ec2_app" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Policy: Allow RDS IAM authentication (generates temporary DB tokens)
resource "aws_iam_role_policy" "rds_iam_auth" {
  name = "${var.project_name}-${var.environment}-rds-iam-auth"
  role = aws_iam_role.ec2_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "rds-db:connect"
        Resource = "arn:aws:rds-db:${var.aws_region}:*:dbuser:*/*"
      }
    ]
  })
}

# Policy: SSM Session Manager — allows secure shell access without SSH keys
resource "aws_iam_role_policy_attachment" "ssm_managed" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile (the bridge between EC2 and IAM role)
resource "aws_iam_instance_profile" "ec2_app" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_app.name
}
