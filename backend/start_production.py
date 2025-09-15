import os
import multiprocessing
import subprocess
import sys

def get_worker_count():
    """Calculate optimal number of workers based on CPU cores"""
    cpu_count = multiprocessing.cpu_count()
    # For CPU-bound tasks: workers = cpu_count
    # For I/O-bound tasks (like web APIs): workers = (2 * cpu_count) + 1
    # We'll use a conservative approach for production stability
    workers = min(cpu_count, 16)  # Cap at 16 workers to avoid resource exhaustion
    return workers

def main():
    print("🚀 Starting Raindropio Clone API in production mode")
    
    workers = get_worker_count()
    cpu_count = multiprocessing.cpu_count()
    
    print(f"👥 Using {workers} worker processes")
    print(f"🖥️  Detected {cpu_count} CPU cores")
    
    # Gunicorn command with corrected arguments
    cmd = [
        "gunicorn",
        "main:app",
        "--workers", str(workers),
        "--worker-class", "uvicorn.workers.UvicornWorker",
        "--bind", "0.0.0.0:8000",
        "--timeout", "120",
        "--max-requests", "1000",
        "--max-requests-jitter", "50",
        "--worker-connections", "1000",
        "--preload",
        "--access-logfile", "-",
        "--error-logfile", "-",
        "--log-level", "info"
    ]
    
    print(f"🔧 Command: {' '.join(cmd)}")
    
    try:
        # Execute the command
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Shutting down server...")
        sys.exit(0)

if __name__ == "__main__":
    main()