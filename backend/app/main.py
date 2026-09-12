from pathlib import Path
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
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")