# 💰 Lending Ledger Application

---

## 📥 How to install (for non-technical users)

You can install **Lending Ledger** like a normal desktop app using the links below. No coding or command line needed.

### Step 1: Open the GitHub page

1. Open your web browser (Chrome, Safari, Edge, etc.).
2. Go to the project’s GitHub page (the link from your team or developer).  
   - To go straight to installers, add `/releases` to the end of that link (e.g. `https://github.com/ayushvarshn/ledgerbook/releases`).

### Step 2: Open Releases

1. On the GitHub page, find the **Releases** section.  
   - You can click the **“Releases”** link on the right side of the page,  
   - Or go directly to: **Releases** (often under the green **Code** button).
2. Click on the **latest release** (the one at the top, e.g. “v0.1.0”).

### Step 3: Download the right file for your computer

In the release, you’ll see a list of files. Download **only one** file, depending on your system:

| Your computer | Download this file |
|---------------|--------------------|
| **Windows**   | A file ending in `.msi` or `.exe` (e.g. `Lending-Ledger_0.1.0_x64_en-US.msi`) |
| **Mac (Apple)** | A file ending in `.dmg` (e.g. `Lending-Ledger_0.1.0_aarch64.dmg` for Apple Silicon, or `_x64.dmg` for Intel Mac) |
| **Linux**     | A file ending in `.deb` or `.AppImage` (e.g. `lending-ledger_0.1.0_amd64.deb`) |

- Click the file name to download it.
- If your browser asks “Save or Open?”, choose **Save** (or **Open** if you prefer to run it right away).

### Step 4: Install the app

- **Windows:** Double-click the downloaded `.msi` or `.exe`. Follow the installer (Next → Next). You may need to allow the app when Windows asks.
- **Mac:** Double-click the `.dmg`. Drag **Lending Ledger** into the **Applications** folder. You may need to allow it in **System Settings → Privacy & Security** the first time you open it.
- **Linux:** Double-click the `.deb` to install, or make the `.AppImage` executable (Right-click → Properties → Allow executing) and then double-click to run.

### Step 5: Open the app

- **Windows:** Open **Start** menu, search for **“Lending Ledger”**, and click it.
- **Mac:** Open **Finder → Applications** and double-click **Lending Ledger**.
- **Linux:** Find **Lending Ledger** in your applications menu or run the AppImage.

---

**Note:** If you don’t see any release or installer files, the developer may not have published a release yet. Ask them to create a **Release** on GitHub and attach the installer files for your operating system.

---

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
