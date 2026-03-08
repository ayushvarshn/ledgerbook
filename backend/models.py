from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class Customer(Base):
    __tablename__ = 'customers'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    father_name = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    loans = relationship("Loan", back_populates="customer", cascade="all, delete-orphan")


class Loan(Base):
    __tablename__ = 'loans'
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False, index=True)
    interest_rate = Column(Float, default=12.0)  # % per month
    collateral_json = Column(Text, default='[]')
    net_principal = Column(Float, default=0.0)
    as_of_date = Column(String(10), nullable=True)  # ISO YYYY-MM-DD

    customer = relationship("Customer", back_populates="loans")
    transactions = relationship("Transaction", back_populates="loan", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey('loans.id'), index=True, nullable=False)
    type = Column(String(32), nullable=False)  # debit/credit/collateral/return_items
    amount = Column(Float, default=0.0)
    description = Column(Text, default='')
    note = Column(Text, default='')
    date = Column(String(10), nullable=False)  # ISO YYYY-MM-DD

    loan = relationship("Loan", back_populates="transactions")


class Rates(Base):
    __tablename__ = 'rates'
    id = Column(Integer, primary_key=True, index=True)
    gold_rate = Column(Float, default=0.0)
    silver_rate = Column(Float, default=0.0)
    default_interest_rate = Column(Float, default=12.0)


