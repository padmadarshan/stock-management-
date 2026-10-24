import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/inventory", tags=["Inventory Operations"])

@router.get("/movements", response_model=List[schemas.MovementResponse])
def get_movements(limit: Optional[int] = 100, db: Session = Depends(get_db)):
    return db.query(models.Movement).order_by(models.Movement.created_at.desc(), models.Movement.id.desc()).limit(limit).all()

@router.post("/stock-in", response_model=schemas.MovementResponse)
def record_stock_in(data: schemas.MovementCreate, db: Session = Depends(get_db)):
    if data.qty <= 0:
        raise HTTPException(status_code=400, detail="Stock in quantity must be positive.")
    
    product = db.query(models.Product).filter(
        (models.Product.id == data.product) | (models.Product.name == data.product)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    product.stock += data.qty

    movement = models.Movement(
        id=f"MOV-{int(time.time() * 1000)}",
        product=product.name,
        type="Stock in",
        qty=data.qty,
        date=data.date or "Just now",
        reason=data.reason or "Stock in purchase/intake"
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement

@router.post("/stock-out", response_model=schemas.MovementResponse)
def record_stock_out(data: schemas.MovementCreate, db: Session = Depends(get_db)):
    qty = abs(data.qty)
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Stock out quantity must be positive.")

    product = db.query(models.Product).filter(
        (models.Product.id == data.product) | (models.Product.name == data.product)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if product.stock < qty:
        raise HTTPException(status_code=400, detail="Stock out quantity cannot exceed available stock.")

    product.stock -= qty

    movement = models.Movement(
        id=f"MOV-{int(time.time() * 1000)}",
        product=product.name,
        type="Stock out",
        qty=-qty,
        date=data.date or "Just now",
        reason=data.reason or "Stock out / dispatch"
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement

@router.get("/transfers", response_model=List[schemas.TransferResponse])
def get_transfers(db: Session = Depends(get_db)):
    return db.query(models.StockTransfer).order_by(models.StockTransfer.created_at.desc()).all()

@router.post("/transfers", response_model=schemas.TransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(transfer_in: schemas.TransferCreate, db: Session = Depends(get_db)):
    if transfer_in.fromLocation == transfer_in.toLocation:
        raise HTTPException(status_code=400, detail="Source and destination locations must be different.")

    product = db.query(models.Product).filter(
        (models.Product.id == transfer_in.product) | (models.Product.name == transfer_in.product)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    if product.location != transfer_in.fromLocation:
        raise HTTPException(status_code=400, detail=f"Product is located at '{product.location}', not '{transfer_in.fromLocation}'.")

    if product.stock < transfer_in.quantity:
        raise HTTPException(status_code=400, detail="Transfer quantity exceeds available stock.")

    # Update product location
    product.location = transfer_in.toLocation

    transfer = models.StockTransfer(
        id=f"TR-{int(time.time() * 1000)}",
        product=product.name,
        from_location=transfer_in.fromLocation,
        to_location=transfer_in.toLocation,
        quantity=transfer_in.quantity
    )
    db.add(transfer)

    # Log transfer in movements
    db.add(models.Movement(
        id=f"MOV-{int(time.time() * 1000)}",
        product=product.name,
        type="Transfer",
        qty=0,
        date="Just now",
        reason=f"Transfer from {transfer_in.fromLocation} to {transfer_in.toLocation}"
    ))

    db.commit()
    db.refresh(transfer)
    return transfer
