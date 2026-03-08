# Lending Ledger - Python Backend (SQLite)

## Quick start

1) Create venv and install deps

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r backend/requirements.txt
```

2) Run the API

```bash
uvicorn backend.main:app --reload
```

3) Open docs

- Interactive API docs: http://127.0.0.1:8000/docs

## What’s included

- FastAPI server
- SQLite database at `backend/ledger.db`
- SQLAlchemy models and Pydantic schemas
- Endpoints:
  - Customers: POST /customers, GET /customers
  - Loans: POST /loans, GET /loans
  - Transactions: POST /transactions, GET /transactions?loan_id=...
  - Rates: PUT /rates
  - Dues: GET /loans/{loan_id}/dues (monthly interest)

## Schema

- customers(id, name, father_name, address)
- loans(id, customer_id, interest_rate, collateral_json, net_principal, as_of_date)
- transactions(id, loan_id, type, amount, description, note, date)
- rates(id, gold_rate, silver_rate, default_interest_rate)

## Next steps

- Build a desktop UI (e.g., Electron/Tauri) that talks to this API
- Or serve a web front-end from FastAPI (templates or SPA)
- Add authentication if needed
- Package with PyInstaller if you want a single binary


