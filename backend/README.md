# Backend (FastAPI + SQLite)

The desktop app auto-starts the backend when you run `npm run tauri dev`. If the **Save** button (e.g. New Customer) doesn’t work, the backend may not have started — run it manually in a separate terminal.

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8765
```

Then run the app with `npm run tauri dev`. API docs: http://127.0.0.1:8765/docs

## Endpoints

- **Customers:** POST/GET `/customers`
- **Loans:** POST/GET `/loans`
- **Transactions:** POST `/transactions`, GET `/transactions?loan_id=...`
- **Rates:** PUT `/rates`
- **Dues:** GET `/loans/{loan_id}/dues`

Database: SQLite at `backend/ledger.db` (created on first run).
