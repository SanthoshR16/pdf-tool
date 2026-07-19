import os
import uuid
import threading
import time
import json
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

# Helper functions to get and update job status
def get_job_status(job_id: str) -> dict:
    try:
        uuid.UUID(job_id)
    except ValueError:
        return None
    path = os.path.join(TEMP_DIR, f"job_{job_id}.json")
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None

def update_job_status(job_id: str, status: str, download_url: str = None, error_message: str = None):
    path = os.path.join(TEMP_DIR, f"job_{job_id}.json")
    data = {
        "status": status,
        "download_url": download_url,
        "error_message": error_message,
        "updated_at": time.time()
    }
    try:
        with open(path, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Failed to update job status {job_id}: {e}")

# Background worker functions
def run_combine_job(job_id: str, temp_paths: List[str], output_path: str, output_id: str):
    try:
        update_job_status(job_id, "processing")
        merge_pdfs(temp_paths, output_path)
        update_job_status(job_id, "done", download_url=f"/api/download/{output_id}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        update_job_status(job_id, "error", error_message=str(e))
    finally:
        for path in temp_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

def run_compress_job(job_id: str, temp_path: str, output_path: str, output_id: str, level: str):
    try:
        update_job_status(job_id, "processing")
        compress_pdf(temp_path, output_path, level=level)
        update_job_status(job_id, "done", download_url=f"/api/download/{output_id}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        update_job_status(job_id, "error", error_message=str(e))
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

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
    
    # Show existing IDs in downloads store
    existing_ids = []
    if os.path.exists(DOWNLOADS_DIR):
        for filename in os.listdir(DOWNLOADS_DIR):
            if "_" in filename:
                parts = filename.split("_")
                existing_ids.append(parts[0])
    print(f"Startup: Existing IDs in store: {existing_ids}")

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
async def combine(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    if not files or len(files) < 1:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    temp_paths = []
    try:
        # Save and validate each uploaded file
        for file in files:
            path = await save_upload(file)
            temp_paths.append(path)
    except Exception:
        # If any file validation/saving fails, clean up whatever we've saved so far
        for path in temp_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass
        raise

    job_id = str(uuid.uuid4())
    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_combined.pdf"
    output_path = os.path.join(DOWNLOADS_DIR, output_filename)
    
    # Initialize job status to processing
    update_job_status(job_id, "processing")
    
    # Queue processing task
    background_tasks.add_task(run_combine_job, job_id, temp_paths, output_path, output_id)
    
    return {"job_id": job_id}

@app.post("/api/compress")
async def compress(background_tasks: BackgroundTasks, file: UploadFile = File(...), level: str = Form("medium")):
    # Validate level
    if level.lower() not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Invalid compression level. Must be 'low', 'medium', or 'high'.")
        
    temp_path = await save_upload(file)
    job_id = str(uuid.uuid4())
    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_compressed.pdf"
    output_path = os.path.join(DOWNLOADS_DIR, output_filename)
    
    # Initialize job status to processing
    update_job_status(job_id, "processing")
    
    # Queue processing task
    background_tasks.add_task(run_compress_job, job_id, temp_path, output_path, output_id, level)
    
    return {"job_id": job_id}

@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    status_data = get_job_status(job_id)
    if not status_data:
        raise HTTPException(status_code=404, detail="Job not found or has expired")
    
    response_data = {"status": status_data["status"]}
    if status_data["status"] == "done":
        response_data["download_url"] = status_data.get("download_url")
    elif status_data["status"] == "error":
        response_data["error_message"] = status_data.get("error_message") or "Unknown processing error"
        
    return response_data

@app.get("/api/download/{id}")
def download(id: str):
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
        existing_ids = []
        if os.path.exists(DOWNLOADS_DIR):
            for filename in os.listdir(DOWNLOADS_DIR):
                if "_" in filename:
                    existing_ids.append(filename.split("_")[0])
        import logging
        logger = logging.getLogger("uvicorn.error")
        logger.error(f"Download 404: Requested ID '{id}' not found. Existing IDs in store: {existing_ids}")
        raise HTTPException(status_code=404, detail="File not found or has expired")
        
    return FileResponse(
        target_file,
        media_type="application/pdf",
        filename=target_name,
        headers={"Content-Disposition": f'attachment; filename="{target_name}"'}
    )
