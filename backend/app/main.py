import sys
from pathlib import Path

# Ensure backend directory is in sys.path regardless of execution working directory
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.wardrobe import router as wardrobe_router
from app.routes.outfit import router as outfit_router
from app.routes.profile import router as profile_router

app = FastAPI(
    title="AI Smart Wardrobe",
    version="1.0.0",
    description="It is an AI outfit recommendation app"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wardrobe_router)
app.include_router(outfit_router)
app.include_router(profile_router)


@app.get("/health")
def health_check():
    return {"success": True, "health_status": "ok"}


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"message": "AURA AI Stylist API is running", "health": "/health"}