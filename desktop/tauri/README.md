# Lending Ledger (Tauri)

Lightweight desktop app using Tauri, reusing the existing static UI and Python FastAPI backend.

## Prerequisites
- Rust toolchain (rustup) and Tauri CLI (installed automatically via cargo)
- Python 3.10+
- Install Python backend deps (run once from repo root):
  - macOS/Linux:
    ```bash
    python3 -m venv .venv && source .venv/bin/activate
    pip install -r backend/requirements.txt
    ```
  - Windows:
    ```powershell
    py -3 -m venv .venv
    .venv\Scripts\activate
    pip install -r backend\requirements.txt
    ```

## Run (Dev)
```bash
cd desktop/tauri
cargo tauri dev
```
- Tauri loads static UI from `../electron/renderer/app/`
- The app spawns the backend on `127.0.0.1:8765`

## Build (Distributables)
```bash
cd desktop/tauri
cargo tauri build
```
- The `backend/` folder is bundled as a resource
- On first launch, the user must have Python installed

## Notes
- The UI expects backend at `http://127.0.0.1:8765`
- No automatic filesystem access (auto-backup is removed)


