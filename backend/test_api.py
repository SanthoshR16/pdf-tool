import os
import sys
import shutil
import time
import uuid

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app, DOWNLOADS_DIR, TEMP_DIR

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "PDF Tool Backend is running"}
    print("Health check endpoint test passed.")

def test_combine_and_status():
    # Create two dummy pdf files
    from pypdf import PdfWriter
    def create_pdf(path):
        writer = PdfWriter()
        writer.add_blank_page(width=200, height=200)
        with open(path, "wb") as f:
            writer.write(f)

    f1 = os.path.join(TEMP_DIR, "t1.pdf")
    f2 = os.path.join(TEMP_DIR, "t2.pdf")
    create_pdf(f1)
    create_pdf(f2)

    try:
        with open(f1, "rb") as pdf1, open(f2, "rb") as pdf2:
            response = client.post(
                "/api/combine",
                files=[
                    ("files", ("t1.pdf", pdf1, "application/pdf")),
                    ("files", ("t2.pdf", pdf2, "application/pdf")),
                ]
            )
        assert response.status_code == 200
        data = response.json()
        if "download_url" in data:
            download_url = data["download_url"]
            print(f"Fast path triggered. Download URL: {download_url}")
            download_resp = client.get(download_url)
            assert download_resp.status_code == 200
            assert download_resp.headers["content-type"] == "application/pdf"
        else:
            job_id = data.get("job_id")
            assert job_id is not None
            print(f"Submitted combine job: {job_id}")

            # Poll status
            for _ in range(20):
                status_resp = client.get(f"/api/status/{job_id}")
                assert status_resp.status_code == 200
                status_data = status_resp.json()
                print(f"Job status polling: {status_data}")
                if status_data["status"] == "done":
                    download_url = status_data["download_url"]
                    assert download_url.startswith("/api/download/")
                    
                    # Test download
                    download_resp = client.get(download_url)
                    assert download_resp.status_code == 200
                    
                    # Verify file still exists (not deleted immediately)
                    download_resp_2 = client.get(download_url)
                    assert download_resp_2.status_code == 200
                    print("Verified file is not deleted immediately after download.")
                    break
                elif status_data["status"] == "error":
                    raise RuntimeError(f"Job failed with error: {status_data['error_message']}")
                time.sleep(0.5)
            else:
                raise TimeoutError("Job did not finish in time")
    finally:
        if os.path.exists(f1): os.remove(f1)
        if os.path.exists(f2): os.remove(f2)

def test_download_404_logging():
    fake_id = str(uuid.uuid4())
    response = client.get(f"/api/download/{fake_id}")
    assert response.status_code == 404
    print("Verified 404 returned for non-existent ID. Check terminal for error logs.")

def test_combine_20_files():
    from pypdf import PdfWriter
    def create_pdf(path):
        writer = PdfWriter()
        writer.add_blank_page(width=200, height=200)
        with open(path, "wb") as f:
            writer.write(f)

    file_paths = []
    files_payload = []
    
    try:
        # Create 20 files
        for i in range(20):
            path = os.path.join(TEMP_DIR, f"t_20_{i}.pdf")
            create_pdf(path)
            file_paths.append(path)
            # Open file handle
            f_handle = open(path, "rb")
            files_payload.append(("files", (f"t_20_{i}.pdf", f_handle, "application/pdf")))
            
        print("Submitting 20-file combine job...")
        response = client.post("/api/combine", files=files_payload)
        
        # Close all file handles
        for _, (_, f_handle, _) in files_payload:
            f_handle.close()
            
        assert response.status_code == 200
        data = response.json()
        if "download_url" in data:
            download_url = data["download_url"]
            print(f"Fast path triggered for 20 files. Download URL: {download_url}")
            download_resp = client.get(download_url)
            assert download_resp.status_code == 200
        else:
            job_id = data.get("job_id")
            assert job_id is not None
            
            # Poll status
            for _ in range(20):
                status_resp = client.get(f"/api/status/{job_id}")
                assert status_resp.status_code == 200
                status_data = status_resp.json()
                if status_data["status"] == "done":
                    print(f"20-file combine job completed successfully! Download URL: {status_data['download_url']}")
                    break
                elif status_data["status"] == "error":
                    raise RuntimeError(f"20-file combine job failed: {status_data['error_message']}")
                time.sleep(0.5)
            else:
                raise TimeoutError("20-file combine job did not finish in time")
            
    finally:
        for path in file_paths:
            if os.path.exists(path):
                os.remove(path)

def test_compress_high():
    # Create single dummy pdf
    from pypdf import PdfWriter
    def create_pdf(path):
        writer = PdfWriter()
        writer.add_blank_page(width=200, height=200)
        with open(path, "wb") as f:
            writer.write(f)

    path = os.path.join(TEMP_DIR, "t_compress_high.pdf")
    create_pdf(path)
    
    try:
        with open(path, "rb") as f_handle:
            response = client.post(
                "/api/compress",
                files={"file": ("t_compress_high.pdf", f_handle, "application/pdf")},
                data={"level": "high"}
            )
        if response.status_code == 500:
            err = response.json().get("detail", "")
            print(f"High compression job failed (expected if Ghostscript is missing): {err}")
            assert "Ghostscript" in err or "gs" in err
        else:
            assert response.status_code == 200
            data = response.json()
            if "download_url" in data:
                download_url = data["download_url"]
                print(f"Fast path triggered for compression. Download URL: {download_url}")
                download_resp = client.get(download_url)
                assert download_resp.status_code == 200
            else:
                job_id = data.get("job_id")
                assert job_id is not None
                print(f"Submitted High compression job: {job_id}")
                
                # Poll status
                for _ in range(20):
                    status_resp = client.get(f"/api/status/{job_id}")
                    assert status_resp.status_code == 200
                    status_data = status_resp.json()
                    if status_data["status"] == "done":
                        print("High compression completed successfully!")
                        break
                    elif status_data["status"] == "error":
                        err = status_data["error_message"]
                        print(f"High compression job failed (expected if Ghostscript is missing): {err}")
                        assert "Ghostscript" in err or "gs" in err
                        break
                    time.sleep(0.5)
                else:
                    raise TimeoutError("High compression job did not finish in time")
            
    finally:
        if os.path.exists(path):
            os.remove(path)


if __name__ == "__main__":
    print("Starting API integration tests...")
    test_health()
    test_combine_and_status()
    test_download_404_logging()
    test_combine_20_files()
    test_compress_high()
    print("All API integration tests passed successfully!")
