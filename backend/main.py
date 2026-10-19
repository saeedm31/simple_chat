import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import admin, friend

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SimpleChat API", version="1.0.0")

# CORS: only needed when the frontend is served from a different origin.
# The Vite dev proxy and a same-origin deployment don't need it at all.
# Set CORS_ORIGINS in .env as a comma-separated list, e.g. https://chat.example.com
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # auth uses a Bearer header, not cookies
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(admin.router)
app.include_router(friend.router)


@app.get("/")
def root():
    return {"status": "SimpleChat API is running", "docs": "/docs"}
