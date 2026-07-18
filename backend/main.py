import os
import uuid
import threading
import time
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from services.pdf_service import merge_pdfs, compress_pdf, check_pdf_header

app = FastAPI(title="PDF Tool API")

# Configure CORS
allowed_origin = os.getenv("ALLOWED_ORIGIN", "*")
if allowed_origin == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origin.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Setup directories
TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads")

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Run file cleanup in a background thread to remove files older than 1 hour
def file_cleanup_worker():
    while True:
        try:
            now = time.time()
            cutoff = now - 3600  # 1 hour ago
            for folder in [TEMP_DIR, DOWNLOADS_DIR]:
                if not os.path.exists(folder):
                    continue
                for item in os.listdir(folder):
                    path = os.path.join(folder, item)
                    if os.path.isfile(path):
                        mtime = os.path.getmtime(path)
                        if mtime < cutoff:
                            try:
                                os.remove(path)
                                print(f"Deleted expired file: {path}")
                            except Exception as e:
                                print(f"Failed to delete expired file {path}: {e}")
        except Exception as e:
            print(f"Cleanup loop error: {e}")
        time.sleep(600)  # Check every 10 minutes

@app.on_event("startup")
def startup_event():
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=file_cleanup_worker, daemon=True)
    cleanup_thread.start()

# Helper to validate and save uploaded files
async def save_upload(file: UploadFile) -> str:
    filename = file.filename or "upload.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail=f"File {filename} is not a PDF")
        
    temp_id = str(uuid.uuid4())
    temp_path = os.path.join(TEMP_DIR, f"{temp_id}.pdf")
    
    # Save file in chunks to limit RAM usage and validate file size (max 200MB)
    MAX_SIZE = 200 * 1024 * 1024
    total_size = 0
    try:
        with open(temp_path, "wb") as out_file:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB chunk
                if not chunk:
                    break
                total_size += len(chunk)
                if total_size > MAX_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail=f"File {filename} exceeds the maximum size of 200MB"
                    )
                out_file.write(chunk)
    except HTTPException:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Verify file header
    if not check_pdf_header(temp_path):
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=400, detail=f"File {filename} is not a valid PDF")
        
    return temp_path

@app.get("/api/health")
def health():
    return {"status": "ok", "message": "PDF Tool Backend is running"}

@app.post("/api/combine")
async def combine(files: List[UploadFile] = File(...)):
    if not files or len(files) < 1:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    temp_paths = []
    try:
        # Save and validate each uploaded file
        for file in files:
            path = await save_upload(file)
            temp_paths.append(path)
            
        # Create output file
        output_id = str(uuid.uuid4())
        output_filename = f"{output_id}_combined.pdf"
        output_path = os.path.join(DOWNLOADS_DIR, output_filename)
        
        # Merge PDFs
        merge_pdfs(temp_paths, output_path)
        
        return {
            "download_url": f"/api/download/{output_id}",
            "filename": "combined.pdf"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF merging failed: {str(e)}")
    finally:
        # Clean up input files immediately after merge
        for path in temp_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

@app.post("/api/compress")
async def compress(file: UploadFile = File(...), level: str = Form("medium")):
    # Validate level
    if level.lower() not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Invalid compression level. Must be 'low', 'medium', or 'high'.")
        
    temp_path = await save_upload(file)
    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_compressed.pdf"
    output_path = os.path.join(DOWNLOADS_DIR, output_filename)
    
    try:
        compress_pdf(temp_path, output_path, level=level)
        return {
            "download_url": f"/api/download/{output_id}",
            "filename": "compressed.pdf"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF compression failed: {str(e)}")
    finally:
        # Clean up input file immediately after compression
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.get("/api/download/{id}")
def download(id: str, background_tasks: BackgroundTasks):
    # Prevent directory traversal attacks by validating uuid format
    try:
        uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid file ID format")
        
    # Search for files starting with the ID in DOWNLOADS_DIR
    target_file = None
    target_name = "document.pdf"
    
    if os.path.exists(DOWNLOADS_DIR):
        for filename in os.listdir(DOWNLOADS_DIR):
            if filename.startswith(id):
                target_file = os.path.join(DOWNLOADS_DIR, filename)
                if "_combined" in filename:
                    target_name = "combined.pdf"
                elif "_compressed" in filename:
                    target_name = "compressed.pdf"
                break
            
    if not target_file or not os.path.exists(target_file):
        raise HTTPException(status_code=404, detail="File not found or has expired")
        
    # Function to delete output file after response completes
    def remove_file(path: str):
        try:
            if os.path.exists(path):
                os.remove(path)
                print(f"Cleaned up output file after download: {path}")
        except Exception as e:
            print(f"Error removing file {path}: {e}")
            
    background_tasks.add_task(remove_file, target_file)
    
    return FileResponse(
        target_file,
        media_type="application/pdf",
        filename=target_name,
        headers={"Content-Disposition": f'attachment; filename="{target_name}"'}
    )
