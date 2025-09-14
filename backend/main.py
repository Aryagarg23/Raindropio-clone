from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import users

app = FastAPI(title="Raindropio Clone API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)

@app.get("/health")
def health():
    return {"status": "ok"}
