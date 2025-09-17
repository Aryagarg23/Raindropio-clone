import json
import sys
import os

# Try to import the FastAPI app. Allow running the script either from repository root
# (where `backend` is an importable package) or from inside the `backend/` folder.
app = None
# Ensure minimal env vars exist so `core.config` doesn't raise during import.
# These placeholders are safe for generating the OpenAPI spec; they are NOT used to access production services.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "anon_dummy_key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "service_role_dummy_key")

try:
    # Preferred: import package-style when running from repo root
    from backend.main import app as _app
    app = _app
except Exception:
    # If that fails, try adding parent directory to sys.path so `backend` becomes importable
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)
    try:
        from backend.main import app as _app
        app = _app
    except Exception:
        # Last resort: execute main.py directly in a fresh namespace using runpy
        try:
            import runpy
            main_ns = runpy.run_path(os.path.join(repo_root, "main.py"))
            app = main_ns.get("app")
        except Exception as e:
            print("Error importing FastAPI app from backend.main:", e)
            print("Hints:")
            print(" - Run this script from the repository root: `python backend/scripts/export_openapi.py`")
            print(" - Ensure required env vars are set (e.g. SUPABASE_URL, SUPABASE_SERVICE_KEY) or refactor to a create_app() factory")
            sys.exit(1)


def export_openapi(path: str = "backend/openapi.json"):
    spec = app.openapi()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2, ensure_ascii=False)
    print(f"Wrote {path}")


if __name__ == "__main__":
    export_openapi()
