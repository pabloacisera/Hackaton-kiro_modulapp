# infra

Docker and Nginx configuration for development and production.

## Structure

```
infra/
  docker-compose.yml      # Development environment
  docker-compose.prod.yml # Production environment
  nginx/                  # Nginx configuration
    nginx.conf            # Main config
    conf.d/               # Site configs
```

## Development

```bash
bash scripts/dev-up.sh
```

Starts all services:
- Landing: http://localhost:3000
- Admin dashboard: http://localhost:3001
- API core: http://localhost:8080
- Payment service: http://localhost:8081
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Production

```bash
bash scripts/prod-up.sh
```

Nginx serves static builds and proxies API requests.

## Environment variables

All services read from `.env` file in the project root.
See `.kiro/steerings/09-environment-variables.md` for details.
