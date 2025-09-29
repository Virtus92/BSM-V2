# BSM V2 Docker Setup

Complete Docker setup for BSM V2 with automatic Supabase and n8n integration.

## Quick Start

1. **Copy environment template:**
   ```bash
   cp .env.docker .env
   ```

2. **Edit environment variables:**
   ```bash
   # Edit .env with your actual values
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   N8N_ENCRYPTION_KEY=your_32_char_encryption_key
   N8N_API_KEY=your_secure_api_key
   ```

3. **Start everything:**
   ```bash
   ./docker-start.sh
   ```

## What Gets Started

- **PostgreSQL** (for n8n): `localhost:5432`
- **n8n Automation**: `localhost:5678`
- **BSM V2 App**: `localhost:3000`

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │      n8n        │    │    BSM V2       │
│   (n8n data)    │◄───┤   Automation    │◄───┤   Application   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▲                       ▲
                                │                       │
                         ┌──────────────┐      ┌──────────────┐
                         │   External   │      │   External   │
                         │   Supabase   │      │   Supabase   │
                         │   Database   │      │   Database   │
                         └──────────────┘      └──────────────┘
```

## Services

### 1. Setup Service
- Runs once on startup
- Applies Supabase migrations
- Configures n8n integration
- Validates connections

### 2. PostgreSQL
- Dedicated database for n8n
- Health checks enabled
- Persistent data volume

### 3. n8n
- Automation platform
- Connected to Supabase via credentials
- API secured with N8N_API_KEY
- Web UI for workflow management

### 4. BSM V2 Application
- Next.js production build
- Connected to external Supabase
- Connected to n8n for workflows
- Health checks enabled

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `N8N_ENCRYPTION_KEY` | 32-character encryption key | ✅ |
| `N8N_API_KEY` | Secure API key for n8n | ✅ |
| `N8N_DB_USER` | n8n database user | Auto |
| `N8N_DB_PASSWORD` | n8n database password | Auto |
| `N8N_DB_NAME` | n8n database name | Auto |

## Health Checks

All services include health checks:

- **App**: `GET /api/health` - Checks Supabase and n8n connectivity
- **n8n**: `GET /rest/healthz` - Internal n8n health check
- **PostgreSQL**: `pg_isready` - Database readiness

## Troubleshooting

### 1. Migration Failures
```bash
# Check setup service logs
docker-compose logs setup

# Manually apply migrations
docker-compose exec app npx supabase db push
```

### 2. n8n Connection Issues
```bash
# Check n8n logs
docker-compose logs n8n

# Verify API key
curl -H "X-N8N-API-KEY: your_key" http://localhost:5678/rest/healthz
```

### 3. Database Connection
```bash
# Check app health
curl http://localhost:3000/api/health

# Check database connectivity
docker-compose exec app npm run db:check
```

## Development

### Local Development
```bash
# For development without Docker
npm run dev
```

### Rebuilding
```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose build app
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

## Production Deployment

1. **Set production environment variables**
2. **Enable SSL/TLS termination**
3. **Configure reverse proxy (nginx/Traefik)**
4. **Set up monitoring and backups**

## Security Notes

- n8n API is secured with API key
- All inter-service communication uses internal Docker network
- Supabase RLS policies are enforced
- Environment variables are isolated per service