from fastapi import FastAPI
from app.routers import health

app = FastAPI(
    title="FastAPI Scaffold",
    description="A tiny FastAPI project scaffold",
    version="0.1.0"
)

# Include routers
app.include_router(health.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI scaffold!"}