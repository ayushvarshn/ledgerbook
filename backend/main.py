from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from typing import List

from .database import Base, engine, get_db
from . import models, schemas, crud

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lending Ledger Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def loan_to_out(loan: models.Loan) -> schemas.LoanOut:
    items = []
    try:
        items = json.loads(loan.collateral_json or '[]')
    except Exception:
        items = []
    return schemas.LoanOut(
        id=loan.id,
        customer_id=loan.customer_id,
        interest_rate=loan.interest_rate,
        collateral_items=items,
        net_principal=loan.net_principal or 0.0,
        as_of_date=loan.as_of_date,
    )


# Customers
@app.post("/customers", response_model=schemas.CustomerOut)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, payload)


@app.get("/customers", response_model=List[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return crud.list_customers(db)


@app.put("/customers/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    cust = crud.update_customer(db, customer_id, payload)
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust


@app.delete("/customers/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_customer(db, customer_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Customer not found")
    return


# Loans
@app.post("/loans", response_model=schemas.LoanOut)
def create_loan(payload: schemas.LoanCreate, db: Session = Depends(get_db)):
    loan = crud.create_loan(db, payload)
    return loan_to_out(loan)


@app.get("/loans", response_model=List[schemas.LoanOut])
def list_loans(db: Session = Depends(get_db)):
    loans = crud.list_loans(db)
    return [loan_to_out(l) for l in loans]


@app.put("/loans/{loan_id}", response_model=schemas.LoanOut)
def update_loan(loan_id: int, payload: schemas.LoanCreate, db: Session = Depends(get_db)):
    loan = crud.update_loan(db, loan_id, payload)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan_to_out(loan)


@app.delete("/loans/{loan_id}", status_code=204)
def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_loan(db, loan_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Loan not found")
    return


# Transactions
@app.post("/transactions", response_model=schemas.TransactionOut)
def create_transaction(payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    # minimal validation
    loan = db.query(models.Loan).filter(models.Loan.id == payload.loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    tx = crud.create_transaction(db, payload)
    return tx


@app.get("/transactions", response_model=List[schemas.TransactionOut])
def list_transactions(loan_id: int | None = None, db: Session = Depends(get_db)):
    return crud.list_transactions(db, loan_id)


@app.put("/transactions/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(tx_id: int, payload: schemas.TransactionCreate, db: Session = Depends(get_db)):
    tx = crud.update_transaction(db, tx_id, payload)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@app.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_transaction(db, tx_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return


# Rates
@app.put("/rates", response_model=schemas.RatesUpdate)
def update_rates(payload: schemas.RatesUpdate, db: Session = Depends(get_db)):
    r = crud.update_rates(db, payload)
    return schemas.RatesUpdate(gold_rate=r.gold_rate, silver_rate=r.silver_rate, default_interest_rate=r.default_interest_rate)


@app.get("/rates", response_model=schemas.RatesUpdate)
def get_rates(db: Session = Depends(get_db)):
    r = crud.ensure_rates(db)
    return schemas.RatesUpdate(gold_rate=r.gold_rate, silver_rate=r.silver_rate, default_interest_rate=r.default_interest_rate)


# Dues calculation (monthly interest, similar to existing logic)
def calculate_interest_monthly(principal: float, monthly_rate_pct: float, start_date: str, end_date: str) -> float:
    from datetime import datetime
    fmt = "%Y-%m-%d"
    s = datetime.strptime(start_date, fmt)
    e = datetime.strptime(end_date, fmt)
    if e <= s:
        return 0.0
    days = (e - s).days
    months = days / 30.0
    return principal * (monthly_rate_pct / 100.0) * months


@app.get("/loans/{loan_id}/dues", response_model=schemas.DuesOut)
def get_dues(loan_id: int, today: str | None = None, db: Session = Depends(get_db)):
    from datetime import datetime
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    txs = db.query(models.Transaction).filter(models.Transaction.loan_id == loan_id).order_by(models.Transaction.date.asc(), models.Transaction.id.asc()).all()
    principal = 0.0
    interest = 0.0
    last_date = None
    for t in txs:
        if last_date:
            interest += calculate_interest_monthly(principal, loan.interest_rate, last_date, t.date)
        last_date = t.date
        if (t.type or '').lower() == 'debit':
            principal += float(t.amount or 0)
        elif (t.type or '').lower() == 'credit':
            payment = float(t.amount or 0)
            pay_interest = min(payment, interest)
            interest -= pay_interest
            payment -= pay_interest
            principal = max(0.0, principal - payment)
    # accrue to today
    if not today:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    if last_date:
        interest += calculate_interest_monthly(principal, loan.interest_rate, last_date, today)
    principal = round(principal, 2)
    interest = round(max(0.0, interest), 2)
    return schemas.DuesOut(
        principal_disbursed=sum(float(t.amount or 0) for t in txs if (t.type or '').lower() == 'debit'),
        payments_received=sum(float(t.amount or 0) for t in txs if (t.type or '').lower() == 'credit'),
        principal_due=principal,
        interest_due=interest,
        total_due=round(principal + interest, 2),
    )


@app.get("/loans/{loan_id}/schedule")
def get_schedule(loan_id: int, today: str | None = None, db: Session = Depends(get_db)):
    from datetime import datetime
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    txs = db.query(models.Transaction).filter(models.Transaction.loan_id == loan_id).order_by(models.Transaction.date.asc(), models.Transaction.id.asc()).all()
    principal = 0.0
    interest = 0.0
    last_date = None
    entries = []
    for t in txs:
        if last_date:
            interest += calculate_interest_monthly(principal, loan.interest_rate, last_date, t.date)
        last_date = t.date
        if (t.type or '').lower() == 'debit':
            principal += float(t.amount or 0)
        elif (t.type or '').lower() == 'credit':
            payment = float(t.amount or 0)
            pay_interest = min(payment, interest)
            interest -= pay_interest
            payment -= pay_interest
            principal = max(0.0, principal - payment)
        entries.append({
            'date': t.date,
            'principalDue': round(principal, 2),
            'interestDue': round(max(0.0, interest), 2)
        })
    if not today:
        today = datetime.utcnow().strftime("%Y-%m-%d")
    today_entry = None
    if last_date:
        addl = calculate_interest_monthly(principal, loan.interest_rate, last_date, today)
        today_entry = {
            'date': today,
            'principalDue': round(principal, 2),
            'interestDue': round(max(0.0, interest + addl), 2)
        }
    return { 'entries': entries, 'today': today_entry }


