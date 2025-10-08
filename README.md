# 💰 Lending Ledger Application

## Overview
A simple and efficient application to maintain ledgers for a **lending-based business**.  
It helps **lenders** record customer details, loans, collaterals, and transactions digitally — replacing handwritten records.

---

## 👤 Users
**Lender** — lends money to customers against collateral.

---

## 🎯 Purpose
- Simplify and digitize data entry (currently manual)
- Automatically calculate **net due amounts**
- Maintain accurate records for loans and collaterals

---

## ⚙️ User Actions

| Action | Description |
|--------|--------------|
| **CRUD Customers** | Add, view, update, and delete customers |
| **CRUD Loans** | Create and manage loans for each customer |
| **CRUD Transactions** | Record payments or disbursements for loans |

---

## 🧱 Entity Details

### Customer
- Customer_ID
- Name
- Father's Name
- Address

### Loan
- Customer_ID
- Loan_ID
- Collateral
- Transactions
- Net Due
- Interest Rate

### Collateral
- Loan_ID
- Item
- Weight
- %Purity
- Net Weight

### Transaction
- Loan_ID
- Transaction_ID
- Transaction_Type (Credit / Debit)
- Amount
- Date

### Rates
- SilverRate
- GoldRate

---

## 🔗 Entity Mapping

| From | To | Relationship |
|------|----|---------------|
| Customer | Loan | One-to-Many |
| Loan | Transaction | One-to-Many |
| Loan | Collateral | One-to-One |

---

## 🌐 Global Defaults
- Interest Rate (default applied to all loans unless specified)

---

## 🧩 Future Enhancements
- Dashboard for outstanding amounts and interest summaries  
- Export reports to Excel/PDF  
- Role-based access (Admin, Operator)  
- Automated interest calculations by date
