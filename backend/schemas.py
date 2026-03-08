from pydantic import BaseModel, Field
from typing import List, Optional


class CollateralItem(BaseModel):
    name: str
    metalType: str
    weight: float
    purity: float = 0.0


class CustomerCreate(BaseModel):
    name: str
    father_name: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerCreate):
    id: int
    class Config:
        from_attributes = True


class LoanCreate(BaseModel):
    customer_id: int
    interest_rate: float = 12.0
    collateral_items: List[CollateralItem] = Field(default_factory=list)
    net_principal: float = 0.0
    as_of_date: Optional[str] = None


class LoanOut(BaseModel):
    id: int
    customer_id: int
    interest_rate: float
    collateral_items: List[CollateralItem] = Field(default_factory=list)
    net_principal: float
    as_of_date: Optional[str] = None
    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    loan_id: int
    type: str
    amount: float = 0.0
    description: Optional[str] = ''
    note: Optional[str] = ''
    date: str  # ISO


class TransactionOut(TransactionCreate):
    id: int
    class Config:
        from_attributes = True


class RatesUpdate(BaseModel):
    gold_rate: Optional[float] = None
    silver_rate: Optional[float] = None
    default_interest_rate: Optional[float] = None


class DuesOut(BaseModel):
    principal_disbursed: float
    payments_received: float
    principal_due: float
    interest_due: float
    total_due: float


