import os
import subprocess
import shutil
import time
import asyncio
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

def compress_pdf_pypdf(input_path: str, output_path: str) -> None:
    """Fallback compression using pypdf content stream compression."""
    reader = PdfReader(input_path)
    writer = PdfWriter()
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)
    with open(output_path, "wb") as f:
        writer.write(f)
    writer.close()

async def compress_pdf(input_path: str, output_path: str, level: str = "medium", progress_callback=None) -> dict:
    """Compresses a PDF file using Ghostscript with pypdf fallback, returning compression stats."""
    if not os.path.exists(input_path):
        raise ValueError(f"Input file not found: {input_path}")
    if not check_pdf_header(input_path):
        raise ValueError("Invalid PDF format. Only valid PDF files can be compressed.")
        
    original_size = os.path.getsize(input_path)

    # Ghostscript resolution & quality parameters tuned for each mode:
    # "high" = Extreme compression (smallest file size, ~72 DPI downsampling)
    # "medium" = Recommended compression (balanced, ~150 DPI downsampling)
    # "low" = Less compression (highest quality, ~220 DPI downsampling)
    level_lower = level.lower()
    if level_lower == "high":
        gs_setting = "/screen"
        dpi = "72"
        qfactor = "0.45"
    elif level_lower == "low":
        gs_setting = "/printer"
        dpi = "220"
        qfactor = "0.90"
    else:  # medium / recommended
        gs_setting = "/ebook"
        dpi = "150"
        qfactor = "0.75"
    
    gs_exe = find_ghostscript_executable()
    
    cmd = [
        gs_exe,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={gs_setting}",
        "-dDownsampleColorImages=true",
        "-dColorImageDownsampleType=/Bicubic",
        f"-dColorImageResolution={dpi}",
        "-dDownsampleGrayImages=true",
        "-dGrayImageDownsampleType=/Bicubic",
        f"-dGrayImageResolution={dpi}",
        "-dDownsampleMonoImages=true",
        "-dMonoImageDownsampleType=/Bicubic",
        f"-dMonoImageResolution={dpi}",
        f"-dJPEGQFactor={qfactor}",
        "-dAutoRotatePages=/None",
        "-dCompressPages=true",
        "-dUseFlateCompression=true",
        "-dNumRenderingThreads=1",
        "-dQUIET",
        "-dBATCH",
        "-dNOPAUSE",
        "-dSAFER",
        f"-sOutputFile={output_path}",
        input_path
    ]
    
    gs_failed = False
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=240.0)
        if process.returncode != 0:
            gs_failed = True
    except (FileNotFoundError, asyncio.TimeoutError, Exception):
        gs_failed = True

    # If Ghostscript failed or generated a file >= original size, try pypdf stream compression fallback
    gs_size = os.path.getsize(output_path) if (not gs_failed and os.path.exists(output_path)) else float('inf')
    
    if gs_failed or gs_size >= original_size:
        temp_pypdf_path = output_path + ".pypdf.tmp"
        try:
            compress_pdf_pypdf(input_path, temp_pypdf_path)
            pypdf_size = os.path.getsize(temp_pypdf_path)
            if pypdf_size < original_size and pypdf_size < gs_size:
                shutil.move(temp_pypdf_path, output_path)
            elif gs_size < original_size:
                # Ghostscript produced a smaller file than pypdf, keep Ghostscript output
                pass
            else:
                # If neither produced a smaller file, copy original so size NEVER increases
                shutil.copyfile(input_path, output_path)
        except Exception:
            if gs_size < original_size:
                pass
            else:
                shutil.copyfile(input_path, output_path)
        finally:
            if os.path.exists(temp_pypdf_path):
                try:
                    os.remove(temp_pypdf_path)
                except Exception:
                    pass

    compressed_size = os.path.getsize(output_path)
    saved_bytes = max(0, original_size - compressed_size)
    savings_percent = round((saved_bytes / original_size) * 100, 1) if original_size > 0 else 0.0

    return {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "saved_bytes": saved_bytes,
        "savings_percent": savings_percent
    }


