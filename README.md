# PDF Tool

A free, production-ready, beautiful web application for combining and compressing PDF files. 

## Features
- **Combine PDFs**: Merge multiple PDF files into one. Drag and drop files, reorder them, and download the combined file.
- **Compress PDFs**: Reduce the file size of a PDF. Choose between Low, Medium, and High compression settings (using Ghostscript).
- **Static Pages**: Privacy Policy, Terms & Conditions, and Contact pages.
- **Auto-Cleanup**: Automatically deletes uploaded and generated temporary files older than 1 hour.
- **Completely Free**: No watermarks, no account registration required, no third-party APIs used.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) + `pypdf` + Ghostscript

---

## Local Setup & Run

### 1. Prerequisites
- Python 3.11+
- Node.js & npm
- **Ghostscript** must be installed on your system and added to your system's PATH.
  - *Windows*: Download from the official site and add the folder containing `gswin64c.exe` to your User/System Environment PATH (and rename it to `gs` or configure the backend code to search for both `gs` and `gswin64c`).
  - *macOS*: `brew install ghostscript`
  - *Linux*: `sudo apt-get install ghostscript`

### 2. Run Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

### 3. Run Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required Node packages:
   ```bash
   npm install
   ```
3. Create a `.env` file inside the `frontend/` folder:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## Deployment (Render.com + Vercel)

### Backend Deployment (Render.com)
1. Deploy as a **Web Service** with **Docker** environment.
2. Render will build the container using the root `Dockerfile` (which automatically installs Ghostscript).
3. The server runs on port `10000`.

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel.
2. Select `frontend/` as the root directory.
3. Configure the environment variable `VITE_API_URL` to point to your backend Render URL (e.g., `https://your-backend.onrender.com`).
4. Build and deploy.
