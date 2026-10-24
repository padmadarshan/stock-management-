import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stockwise.db")

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/stockwise_db")
FALLBACK_SQLITE = os.getenv("FALLBACK_SQLITE", "true").lower() in ("true", "1", "yes")
SQLITE_URL = os.getenv("SQLITE_URL", "sqlite:///./stockwise.db")

engine = None
active_db_type = "unknown"

try:
    # Try connecting to MySQL
    logger.info(f"Attempting to connect to primary database: {DATABASE_URL}")
    test_engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
    active_db_type = "MySQL"
    logger.info("Successfully connected to MySQL database.")
except Exception as e:
    if FALLBACK_SQLITE:
        logger.warning(f"Could not connect to MySQL ({e}). Falling back to local SQLite database: {SQLITE_URL}")
        engine = create_engine(
            SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        active_db_type = "SQLite (Fallback mode - MySQL server not running)"
    else:
        logger.error(f"Failed to connect to database: {e}")
        raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
