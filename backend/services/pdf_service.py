import os
import subprocess
import shutil
from typing import List
from pypdf import PdfWriter, PdfReader

def check_pdf_header(file_path: str) -> bool:
    """Verifies that the file starts with the correct %PDF header."""
    try:
        with open(file_path, 'rb') as f:
            header = f.read(4)
            return header == b'%PDF'
    except Exception:
        return False

def merge_pdfs(pdf_paths: List[str], output_path: str) -> None:
    """Merges multiple PDFs using pypdf."""
    writer = PdfWriter()
    try:
        for path in pdf_paths:
            if not os.path.exists(path):
                raise ValueError(f"File not found: {path}")
            if not check_pdf_header(path):
                raise ValueError(f"Invalid PDF file signature: {os.path.basename(path)}")
            try:
                PdfReader(path)
            except Exception as e:
                raise ValueError(f"Corrupted or unsupported PDF structure in '{os.path.basename(path)}'. Details: {str(e)}")
            
            writer.append(path)
        writer.write(output_path)
    finally:
        writer.close()


def find_ghostscript_executable() -> str:
    """Locates the Ghostscript executable depending on the operating system."""
    # Check if 'gs' is available in the path (Linux, macOS, Windows if symlinked)
    if shutil.which("gs"):
        return "gs"
    # Check if 'gswin64c' is available in the path (Windows)
    if shutil.which("gswin64c"):
        return "gswin64c"
    # Check common default Windows installation paths for gs
    common_paths = [
        r"C:\Program Files\gs\gs10.03.1\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.03.0\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.02.1\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.02.0\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.01.2\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.01.1\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs10.00.0\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs9.56.1\bin\gswin64c.exe",
        r"C:\Program Files\gs\gs9.55.0\bin\gswin64c.exe",
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
            
    # Default fallback to 'gs' which represents the standard command
    return "gs"

def compress_pdf(input_path: str, output_path: str, level: str = "medium") -> None:
    """Compresses a PDF file using Ghostscript."""
    if not os.path.exists(input_path):
        raise ValueError(f"Input file not found: {input_path}")
    if not check_pdf_header(input_path):
        raise ValueError("Invalid PDF format. Only valid PDF files can be compressed.")
        
    try:
        PdfReader(input_path)
    except Exception as e:
        raise ValueError(f"Corrupted or unsupported PDF structure. Details: {str(e)}")

    # Map level to Ghostscript PDFSETTINGS options
    # Low compression (printer) keeps higher quality; High compression (screen) reduces size significantly.
    settings_map = {
        "low": "/printer",
        "medium": "/ebook",
        "high": "/screen"
    }
    gs_setting = settings_map.get(level.lower(), "/ebook")
    
    gs_exe = find_ghostscript_executable()
    
    cmd = [
        gs_exe,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={gs_setting}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        input_path
    ]
    
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr or e.stdout or "Unknown Ghostscript error"
        raise RuntimeError(f"Ghostscript execution failed: {error_msg}")
    except FileNotFoundError:
        raise RuntimeError(
            "Ghostscript executable not found. Make sure Ghostscript is installed and added to the environment PATH."
        )
