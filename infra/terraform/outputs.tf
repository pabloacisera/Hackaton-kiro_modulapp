# ──────────────────────────────────────────────────────────────────────────────
# Outputs — Useful information after terraform apply
# ──────────────────────────────────────────────────────────────────────────────

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.app.id
}

output "public_ip" {
  description = "Elastic IP assigned to the instance"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = length(var.ssh_allowed_cidrs) > 0 ? "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.app.public_ip}" : "SSH disabled. Use SSM: aws ssm start-session --target ${aws_instance.app.id}"
}

output "ssm_command" {
  description = "SSM Session Manager command (no SSH key needed)"
  value       = "aws ssm start-session --target ${aws_instance.app.id} --region ${var.aws_region}"
}

output "app_health_check" {
  description = "URL to verify the app is running (via Nginx)"
  value       = "http://${aws_eip.app.public_ip}/health"
}

output "security_group_id" {
  description = "Security group ID (useful if you need to add RDS access)"
  value       = aws_security_group.modula_app.id
}
