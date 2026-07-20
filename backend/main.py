import os
import uuid
import asyncio
import time
import json
import logging
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from services.pdf_service import merge_pdfs, compress_pdf, check_pdf_header

# Configure logging
logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="PDF Tool API")

# Add Gzip Response Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

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

gs_lock = asyncio.Lock()

def update_job_status(job_id: str, status: str, progress: int = 0, download_url: str = None, error_message: str = None):
    path = os.path.join(TEMP_DIR, f"job_{job_id}.json")
    data = {
        "status": status,
        "progress": progress,
        "download_url": download_url,
        "error_message": error_message,
        "updated_at": time.time()
    }
    try:
        with open(path, "w") as f:
            json.dump(data, f)
    except Exception as e:
        logger.error(f"Failed to update job status {job_id}: {e}")

# Helper sync merge function
def merge_pdfs_sync(temp_paths: List[str], output_path: str):
    from pypdf import PdfWriter
    writer = PdfWriter()
    try:
        for path in temp_paths:
            writer.append(path)
        writer.write(output_path)
    finally:
        writer.close()

# Background worker functions
def run_combine_job(job_id: str, temp_paths: List[str], output_path: str, output_id: str):
    try:
        update_job_status(job_id, "processing", progress=0)
        total_files = len(temp_paths)
        from pypdf import PdfWriter
        writer = PdfWriter()
        try:
            for idx, path in enumerate(temp_paths):
                writer.append(path)
                progress = int(((idx + 1) / total_files) * 100)
                update_job_status(job_id, "processing", progress=min(progress, 99))
            writer.write(output_path)
        finally:
            writer.close()
        update_job_status(job_id, "done", progress=100, download_url=f"/api/download/{output_id}")
    except Exception as e:
        logger.error(f"Error in combine job {job_id}: {e}")
        update_job_status(job_id, "error", error_message=str(e))
    finally:
        for path in temp_paths:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

async def run_combine_job_async(job_id: str, temp_paths: List[str], output_path: str, output_id: str):
    start_time = time.time()
    logger.info(f"[Combine Job {job_id}] Started merging {len(temp_paths)} files")
    await asyncio.to_thread(run_combine_job, job_id, temp_paths, output_path, output_id)
    duration = time.time() - start_time
    logger.info(f"[Combine Job {job_id}] Completed merging in {duration:.4f} seconds")

async def run_compress_job(job_id: str, temp_path: str, output_path: str, output_id: str, level: str):
    start_time = time.time()
    logger.info(f"[Compress Job {job_id}] Started compression at level {level}")
    try:
        update_job_status(job_id, "processing", progress=0)
        async with gs_lock:
            await compress_pdf(temp_path, output_path, level=level)
        update_job_status(job_id, "done", progress=100, download_url=f"/api/download/{output_id}")
    except Exception as e:
        logger.error(f"Error in compress job {job_id}: {e}")
        update_job_status(job_id, "error", error_message=str(e))
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        duration = time.time() - start_time
        logger.info(f"[Compress Job {job_id}] Completed compression in {duration:.4f} seconds")

# Run file cleanup in a background thread to remove files older than 1 hour
def file_cleanup_worker():
    import time
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
                                logger.info(f"Deleted expired file: {path}")
                            except Exception as e:
                                logger.error(f"Failed to delete expired file {path}: {e}")
        except Exception as e:
            logger.error(f"Cleanup loop error: {e}")
        time.sleep(600)  # Check every 10 minutes

@app.on_event("startup")
def startup_event():
    import threading
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
    logger.info(f"Startup: Existing IDs in store: {existing_ids}")

# Helper to validate and save uploaded files (one-pass validation)
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
        
    # Verify PDF structure (PdfReader)
    try:
        from pypdf import PdfReader
        reader = PdfReader(temp_path)
        _ = len(reader.pages)
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(
            status_code=400,
            detail=f"Corrupted or unsupported PDF structure in '{filename}'. Details: {str(e)}"
        )
        
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

    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_combined.pdf"
    output_path = os.path.join(DOWNLOADS_DIR, output_filename)
    
    # Fast path for files < 5MB
    total_size = sum(os.path.getsize(p) for p in temp_paths)
    if total_size < 5 * 1024 * 1024:
        start_time = time.time()
        logger.info(f"[Combine Fast Path] Merging {len(temp_paths)} files ({total_size / 1024 / 1024:.2f}MB)")
        try:
            await asyncio.to_thread(merge_pdfs_sync, temp_paths, output_path)
            duration = time.time() - start_time
            logger.info(f"[Combine Fast Path] Completed in {duration:.4f} seconds")
            return {"download_url": f"/api/download/{output_id}"}
        except Exception as e:
            logger.error(f"[Combine Fast Path] Failed: {e}")
            raise HTTPException(status_code=500, detail=f"PDF merging failed: {str(e)}")
        finally:
            for path in temp_paths:
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception:
                        pass

    job_id = str(uuid.uuid4())
    # Initialize job status to processing
    update_job_status(job_id, "processing", progress=0)
    
    # Queue processing task
    background_tasks.add_task(run_combine_job_async, job_id, temp_paths, output_path, output_id)
    
    return {"job_id": job_id}

@app.post("/api/compress")
async def compress(background_tasks: BackgroundTasks, file: UploadFile = File(...), level: str = Form("medium")):
    # Validate level
    if level.lower() not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Invalid compression level. Must be 'low', 'medium', or 'high'.")
        
    temp_path = await save_upload(file)
    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_compressed.pdf"
    output_path = os.path.join(DOWNLOADS_DIR, output_filename)
    
    # Fast path for file < 5MB
    file_size = os.path.getsize(temp_path)
    if file_size < 5 * 1024 * 1024:
        start_time = time.time()
        logger.info(f"[Compress Fast Path] Compressing {file.filename} ({file_size / 1024 / 1024:.2f}MB) at level {level}")
        try:
            async with gs_lock:
                await compress_pdf(temp_path, output_path, level=level)
            duration = time.time() - start_time
            logger.info(f"[Compress Fast Path] Completed in {duration:.4f} seconds")
            return {"download_url": f"/api/download/{output_id}"}
        except Exception as e:
            logger.error(f"[Compress Fast Path] Failed: {e}")
            raise HTTPException(status_code=500, detail=f"PDF compression failed: {str(e)}")
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass

    job_id = str(uuid.uuid4())
    # Initialize job status to processing
    update_job_status(job_id, "processing", progress=0)
    
    # Queue processing task
    background_tasks.add_task(run_compress_job, job_id, temp_path, output_path, output_id, level)
    
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    status_data = get_job_status(job_id)
    if not status_data:
        raise HTTPException(status_code=404, detail="Job not found or has expired")
    
    response_data = {
        "status": status_data["status"],
        "progress": status_data.get("progress", 0)
    }
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
