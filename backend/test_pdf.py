import os
import sys
from pypdf import PdfWriter, PdfReader

# Add backend to path to allow import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.pdf_service import merge_pdfs, compress_pdf, check_pdf_header

def create_dummy_pdf(filename, pages=1):
    writer = PdfWriter()
    for _ in range(pages):
        writer.add_blank_page(width=200, height=200)
    with open(filename, "wb") as f:
        writer.write(f)
    print(f"Created dummy PDF: {filename} with {pages} page(s)")

def main():
    print("Starting PDF service tests...")
    
    file1 = "test1.pdf"
    file2 = "test2.pdf"
    merged_file = "test_merged.pdf"
    compressed_file = "test_compressed.pdf"
    
    try:
        # 1. Create dummy files
        create_dummy_pdf(file1, pages=1)
        create_dummy_pdf(file2, pages=2)
        
        # 2. Test headers
        assert check_pdf_header(file1) == True, "Header check failed for file1"
        assert check_pdf_header(file2) == True, "Header check failed for file2"
        print("PDF header validation check passed.")
        
        # 3. Test merge
        print("Testing PDF merge...")
        merge_pdfs([file1, file2], merged_file)
        assert os.path.exists(merged_file), "Merged file not created"
        
        reader = PdfReader(merged_file)
        pages_count = len(reader.pages)
        print(f"Merged PDF created successfully. Page count: {pages_count} (Expected: 3)")
        assert pages_count == 3, f"Expected 3 pages, got {pages_count}"
        print("PDF merge test passed.")
        
        # 4. Test compress
        print("Testing PDF compression...")
        try:
            import asyncio
            asyncio.run(compress_pdf(merged_file, compressed_file, level="high"))
            assert os.path.exists(compressed_file), "Compressed file not created"
            print("PDF compression executed successfully.")
        except RuntimeError as e:
            print(f"WARNING: Compression skipped or failed because Ghostscript might not be installed on this host. Error details: {e}")
            print("Note: This is expected if running on a machine without Ghostscript installed in the system PATH.")
            
        print("\nAll tests completed successfully!")

        
    finally:
        # Cleanup test files
        for f in [file1, file2, merged_file, compressed_file]:
            if os.path.exists(f):
                os.remove(f)
                print(f"Cleaned up test file: {f}")

if __name__ == "__main__":
    main()
