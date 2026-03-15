# Backend (FastAPI + SQLite)

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

## Endpoints

- **Customers:** POST/GET `/customers`
- **Loans:** POST/GET `/loans`
- **Transactions:** POST `/transactions`, GET `/transactions?loan_id=...`
- **Rates:** PUT `/rates`
- **Dues:** GET `/loans/{loan_id}/dues`

Database: SQLite at `backend/ledger.db` (created on first run).
