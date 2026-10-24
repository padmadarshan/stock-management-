import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[schemas.SupplierResponse])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).order_by(models.Supplier.name.asc()).all()

@router.post("", response_model=schemas.SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier_in: schemas.SupplierCreate, db: Session = Depends(get_db)):
    if not supplier_in.name.strip() or not supplier_in.email.strip():
        raise HTTPException(status_code=400, detail="Supplier name and email are required.")

    count = db.query(models.Supplier).count()
    new_id = f"SUP-{str(count + 1).zfill(3)}"
    while db.query(models.Supplier).filter(models.Supplier.id == new_id).first():
        count += 1
        new_id = f"SUP-{str(count + 1).zfill(3)}"

    supplier = models.Supplier(
        id=new_id,
        name=supplier_in.name.strip(),
        email=supplier_in.email.strip(),
        phone=supplier_in.phone or "",
        lead_time=supplier_in.leadTime
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: str, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found.")

    # Check if products use this supplier
    assigned = db.query(models.Product).filter(models.Product.supplier == supplier.name).count()
    if assigned > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete supplier: {assigned} products are currently associated with it.")

    db.delete(supplier)
    db.commit()
    return None
