# FastAPI CRM Backend

This backend is designed to sit beside your existing Next.js CRM frontend.

For local development, it now uses SQLite by default so you can run it without installing PostgreSQL.

## Folder Structure

```text
backend/
  app/
    core/
      config.py
      database.py
      dependencies.py
      security.py
    models/
      __init__.py
      account.py
      base.py
      campaign.py
      lead.py
      product.py
      user.py
    routers/
      __init__.py
      accounts.py
      auth.py
      campaigns.py
      leads.py
      products.py
    schemas/
      account.py
      auth.py
      campaign.py
      lead.py
      product.py
      user.py
    main.py
  .env.example
  requirements.txt
```

## Database Schema

Core tables:

- `users`
- `accounts`
- `leads`
- `campaigns`
- `products`

Important design choices:

- UUID-style string primary keys for API-friendly identifiers.
- `owner_id` foreign keys connect CRM entities to users.
- `tags`, `variants`, `contact_ids`, and `deal_ids` are stored as JSON for flexibility.
- Audit timestamps (`created_at`, `updated_at`) exist on every table.

## API Endpoints

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /accounts`
- `POST /accounts`
- `GET /accounts/{account_id}`
- `PUT /accounts/{account_id}`
- `DELETE /accounts/{account_id}`
- Same CRUD pattern for `/leads`, `/campaigns`, and `/products`

## Local Setup

1. Create a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update the `CRM_*` values if needed.
4. By default the app creates a local SQLite database file named `crm.db` inside `backend/`.
5. Start the API:

```bash
python -m uvicorn app.main:app
```

## Notes

- For this first phase, tables are auto-created on startup with SQLAlchemy.
- In production, switch `CRM_DATABASE_URL` to PostgreSQL and add Alembic migrations before live deployment.
- CORS is configured for your Next.js frontend on `http://localhost:3000`.
