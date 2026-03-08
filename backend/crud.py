import json
from sqlalchemy.orm import Session
from . import models, schemas


def ensure_rates(db: Session) -> models.Rates:
    inst = db.query(models.Rates).first()
    if not inst:
        inst = models.Rates()
        db.add(inst)
        db.commit()
        db.refresh(inst)
    return inst


# Customers
def create_customer(db: Session, data: schemas.CustomerCreate) -> models.Customer:
    cust = models.Customer(name=data.name, father_name=data.father_name, address=data.address)
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


def list_customers(db: Session):
    return db.query(models.Customer).all()


def update_customer(db: Session, customer_id: int, data: schemas.CustomerCreate):
    cust = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not cust:
        return None
    cust.name = data.name
    cust.father_name = data.father_name
    cust.address = data.address
    db.commit(); db.refresh(cust)
    return cust


def delete_customer(db: Session, customer_id: int) -> bool:
    cust = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not cust:
        return False
    db.delete(cust)
    db.commit()
    return True

# Loans
def create_loan(db: Session, data: schemas.LoanCreate) -> models.Loan:
    loan = models.Loan(
        customer_id=data.customer_id,
        interest_rate=data.interest_rate,
        collateral_json=json.dumps([i.model_dump() for i in data.collateral_items]),
        net_principal=data.net_principal,
        as_of_date=data.as_of_date,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def list_loans(db: Session):
    return db.query(models.Loan).all()


def update_loan(db: Session, loan_id: int, data: schemas.LoanCreate):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        return None
    loan.interest_rate = data.interest_rate
    if data.collateral_items is not None:
        loan.collateral_json = json.dumps([i.model_dump() for i in data.collateral_items])
    if data.as_of_date is not None:
        loan.as_of_date = data.as_of_date
    if data.net_principal is not None:
        loan.net_principal = data.net_principal
    db.commit(); db.refresh(loan)
    return loan


def delete_loan(db: Session, loan_id: int) -> bool:
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id).first()
    if not loan:
        return False
    db.delete(loan)
    db.commit()
    return True

# Transactions
def create_transaction(db: Session, data: schemas.TransactionCreate) -> models.Transaction:
    tx = models.Transaction(
        loan_id=data.loan_id,
        type=data.type.lower(),
        amount=data.amount,
        description=data.description or '',
        note=data.note or '',
        date=data.date,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def list_transactions(db: Session, loan_id: int = None):
    q = db.query(models.Transaction)
    if loan_id is not None:
        q = q.filter(models.Transaction.loan_id == loan_id)
    return q.all()


def update_transaction(db: Session, tx_id: int, data: schemas.TransactionCreate):
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        return None
    tx.type = data.type.lower()
    tx.amount = data.amount
    tx.description = data.description or ''
    tx.note = data.note or ''
    tx.date = data.date
    db.commit(); db.refresh(tx)
    return tx


def delete_transaction(db: Session, tx_id: int) -> bool:
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        return False
    db.delete(tx)
    db.commit()
    return True

# Rates
def update_rates(db: Session, data: schemas.RatesUpdate) -> models.Rates:
    r = ensure_rates(db)
    if data.gold_rate is not None:
        r.gold_rate = data.gold_rate
    if data.silver_rate is not None:
        r.silver_rate = data.silver_rate
    if data.default_interest_rate is not None:
        r.default_interest_rate = data.default_interest_rate
    db.commit()
    db.refresh(r)
    return r


