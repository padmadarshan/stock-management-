from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db
from auth import verify_password, get_password_hash, create_access_token, require_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token)
def register(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    new_user = models.User(
        name=user_in.name.strip(),
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        role="Administrator"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    token = create_access_token(data={"sub": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(require_current_user)):
    return current_user
