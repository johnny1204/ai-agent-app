import sys
import subprocess

try:
    import fitz # PyMuPDF
except ImportError:
    print("PyMuPDF (fitz) not found. Installing automatically via pip...", file=sys.stderr)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf", "--user"])
    except subprocess.CalledProcessError:
        try:
            # Fallback for newer Python versions that manage environments strictly
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf", "--break-system-packages"])
        except Exception as e:
            print(f"Failed to auto-install PyMuPDF. Please run 'pip install pymupdf' manually. Error: {e}", file=sys.stderr)
            sys.exit(1)
    import fitz

def extract_pdf_text(filepath):
    try:
        doc = fitz.open(filepath)
        full_text = []
        for page in doc:
            full_text.append(page.get_text())
        print("\n\n".join(full_text))
    except Exception as e:
        print(f"Error parsing PDF: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 pdf-parser-cli.py <path_to_pdf>")
        sys.exit(1)
    
    extract_pdf_text(sys.argv[1])
