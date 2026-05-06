# CRM Workspace

This project is now split into two separate applications:

```text
crm new/
  backend/   FastAPI + PostgreSQL API
  frontend/  Next.js CRM frontend
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
