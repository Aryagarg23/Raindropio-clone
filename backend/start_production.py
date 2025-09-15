#!/usr/bin/env python3
"""
Production startup script for the Raindropio Clone API
Optimized for handling concurrent users
"""

import os
import multiprocessing

def get_worker_count():
    """Calculate optimal number of workers based on CPU cores"""
    cpu_count = multiprocessing.cpu_count()
    # Formula: (2 x CPU cores) + 1
    return min((2 * cpu_count) + 1, 8)  # Cap at 8 workers to avoid memory issues

def main():
    workers = get_worker_count()
    
    print(f"🚀 Starting Raindropio Clone API in production mode")
    print(f"👥 Using {workers} worker processes")
    print(f"🖥️  Detected {multiprocessing.cpu_count()} CPU cores")
    
    # Production configuration
    config = {
        "workers": workers,
        "worker_class": "uvicorn.workers.UvicornWorker",
        "bind": "0.0.0.0:8000",
        "timeout": 120,  # 2 minutes timeout
        "keepalive": 2,
        "max_requests": 1000,  # Restart workers after 1000 requests to prevent memory leaks
        "max_requests_jitter": 50,
        "preload_app": True,  # Load app before forking workers
        "worker_connections": 1000,
    }
    
    # Build gunicorn command
    cmd_parts = [
        "gunicorn",
        "main:app",
        f"--workers {config['workers']}",
        f"--worker-class {config['worker_class']}",
        f"--bind {config['bind']}",
        f"--timeout {config['timeout']}",
        f"--keepalive {config['keepalive']}",
        f"--max-requests {config['max_requests']}",
        f"--max-requests-jitter {config['max_requests_jitter']}",
        f"--worker-connections {config['worker_connections']}",
        "--preload" if config['preload_app'] else "",
        "--access-logfile -",  # Log to stdout
        "--error-logfile -",   # Log to stderr
        "--log-level info",
    ]
    
    cmd = " ".join(filter(None, cmd_parts))
    print(f"🔧 Command: {cmd}")
    
    # Execute
    os.system(cmd)

if __name__ == "__main__":
    main()