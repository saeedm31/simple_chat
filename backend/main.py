from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import admin, friend

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SimpleChat API", version="1.0.0")

# CORS — allow React dev server and local usage
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(friend.router)


@app.get("/")
def root():
    return {"status": "SimpleChat API is running", "docs": "/docs"}
