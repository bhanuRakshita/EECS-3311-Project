# EECS-3311 Project

## Docker setup

This repo includes Docker support for the backend and a PostgreSQL database.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose)

### Run with Docker Compose

From the repository root:

1. Create your local environment file:

```bash
cp .env.example .env
# PowerShell alternative:
Copy-Item .env.example .env
```

2. Start containers:

```bash
docker compose up --build
```

Services:

- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
  - database: `consulting_db`
  - user: `admin`
  - password: `changeme`

### Stop services

```bash
docker compose down
```

To remove database volume too:

```bash
docker compose down -v
```