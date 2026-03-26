from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routers import hospitals, hotels, restaurants, sports
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nearby Places Finder API",
    description="API to find nearby hospitals, hotels, restaurants, and sports facilities using OpenStreetMap data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hospitals.router)
app.include_router(hotels.router)
app.include_router(restaurants.router)
app.include_router(sports.router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """Redirect to the main page"""
    return {"message": "Nearby Places Finder API is running. Visit /static/ for web interfaces."}