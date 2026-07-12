# Fintech Banking API

A JWT-authenticated REST API for a simplified banking system, built with FastAPI and PostgreSQL, fully containerized with Docker.

## Features

- **User authentication** — registration with bcrypt password hashing, login with JWT token issuance
- **Protected endpoints** — JWT-based authorization on all account/transaction routes
- **Account management** — create bank accounts, scoped per authenticated user
- **Transactions** — deposit and withdraw with atomic balance updates and full transaction logging
- **Input validation** — Pydantic field constraints (password length, alphanumeric usernames, positive transaction amounts)
- **Containerized** — Docker Compose setup with a healthcheck-gated startup sequence (API waits for PostgreSQL to be truly ready, not just started)

## Tech Stack

- **FastAPI** — web framework
- **PostgreSQL** — relational database
- **SQLAlchemy** — ORM
- **PyJWT** — token-based authentication
- **bcrypt** — password hashing
- **Pydantic** — request/response validation
- **Docker & Docker Compose** — containerization

## Architecture



- `main.py` — API routes
- `models.py` — SQLAlchemy ORM models (User, Account, Transaction)
- `schemas.py` — Pydantic request/response validation
- `auth.py` — password hashing, JWT creation/verification, auth dependency
- `database.py` — DB connection, environment-driven config

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Create a new user |
| POST | `/login` | No | Authenticate, receive JWT |
| GET | `/accounts/me` | Yes | List authenticated user's accounts |
| POST | `/accounts` | Yes | Create a new bank account |
| POST | `/accounts/{id}/deposit` | Yes | Deposit funds |
| POST | `/accounts/{id}/withdraw` | Yes | Withdraw funds (rejects if insufficient balance) |

## Running Locally

**Requirements:** Docker and Docker Compose

```bash
git clone https://github.com/Xbaig/fintech-banking-api.git
cd fintech-banking-api
docker compose up -d --build
```

API will be available at `http://localhost:8000`

## Example Usage

```bash
# Register
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@example.com", "password": "SecurePass123"}'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "SecurePass123"}'

# Create an account (use token from login response)
curl -X POST http://localhost:8000/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"account_number": "ACC-001"}'
```

## Security Notes

This is a learning/portfolio project. A few things intentionally simplified for now, flagged honestly:
- `SECRET_KEY` for JWT signing is currently a placeholder in code — a production deployment would move this to an environment variable or a secrets manager
- No rate limiting on login attempts

## Roadmap

- [ ] Deploy to AWS EKS
- [ ] CI/CD pipeline via GitHub Actions
- [ ] Load balancer + staging/production environments

## Author

Mehroz (Roz) — [GitHub](https://github.com/Xbaig)