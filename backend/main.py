from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import users, teams, admin, content
from core.config import settings

app = FastAPI(title="Raindropio Clone API", version="1.0.0")

# Configure allowed origins from environment
allowed_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",  # Local development fallback
    "https://localhost:3000",  # HTTPS local development
    "https://raindropio-clone.vercel.app",  # Production frontend
]

# Remove any empty strings from the list
allowed_origins = [origin for origin in allowed_origins if origin and origin.strip()]

print(f"🌐 CORS allowed origins: {allowed_origins}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(admin.router)
app.include_router(content.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}
