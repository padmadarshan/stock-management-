import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import models
from database import engine, SessionLocal, active_db_type
from seed import seed_database
from routers import auth, products, inventory, suppliers, orders, taxonomy, analytics, settings

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    print("\n==================================================")
    print(">>> StockWise Inventory API starting up...")
    print(f"[INFO] Active Database Engine: {active_db_type}")
    print("==================================================")
    
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    yield
    print("\n[INFO] StockWise API shutdown complete.")

app = FastAPI(
    title="StockWise Inventory Management API",
    description="Full-featured RESTful API for StockWise Inventory Intelligence, built with FastAPI and MySQL/SQLAlchemy.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(orders.router)
app.include_router(taxonomy.router)
app.include_router(analytics.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {
        "name": "StockWise Inventory API",
        "status": "online",
        "version": "1.0.0",
        "active_database": active_db_type,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "active_database": active_db_type
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
