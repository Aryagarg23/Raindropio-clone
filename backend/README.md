# Backend

This folder contains the FastAPI backend for Raindropio-clone.


## Local Development

1. Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
2. Copy `.env.example` to `.env` and fill in any missing values.
3. Run the server:
  ```bash
  uvicorn main:app --reload
  ```

## Environment Variables
See `.env.example` and `phase1.md` for required keys and URLs.

## Health Check
Endpoint: `/health` returns `{"status": "ok"}`

## Supabase
Uses Supabase cloud for database/auth. No local Postgres required.

See `/database` for Supabase setup and `PROJECT_PLAN.md` for architecture.
