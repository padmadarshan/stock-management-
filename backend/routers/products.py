import time
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search query across name, sku, category, supplier"),
    category: Optional[str] = Query(None),
    supplier: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Product.name.ilike(s),
                models.Product.sku.ilike(s),
                models.Product.category.ilike(s),
                models.Product.supplier.ilike(s),
                models.Product.barcode.ilike(s),
            )
        )
    if category:
        query = query.filter(models.Product.category == category)
    if supplier:
        query = query.filter(models.Product.supplier == supplier)
    if brand:
        query = query.filter(models.Product.brand == brand)
    if low_stock is not None:
        if low_stock:
            query = query.filter(models.Product.stock <= models.Product.min)

    return query.order_by(models.Product.id.asc()).all()

@router.get("/barcode/{barcode}", response_model=schemas.ProductResponse)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.barcode == barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"No product found with barcode {barcode}")
    return product

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Check SKU uniqueness (case-insensitive)
    existing = db.query(models.Product).filter(models.Product.sku.ilike(product_in.sku)).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU must be unique, ignoring letter case.")
    
    # Generate sequential PRD-XXX ID
    count = db.query(models.Product).count()
    new_id = f"PRD-{str(count + 1).zfill(3)}"
    while db.query(models.Product).filter(models.Product.id == new_id).first():
        count += 1
        new_id = f"PRD-{str(count + 1).zfill(3)}"

    product = models.Product(
        id=new_id,
        name=product_in.name.strip(),
        sku=product_in.sku.strip(),
        category=product_in.category,
        brand=product_in.brand,
        stock=product_in.stock,
        min=product_in.min,
        price=product_in.price,
        supplier=product_in.supplier,
        location=product_in.location or "Store Room",
        barcode=product_in.barcode or "",
        expiry=product_in.expiry
    )
    db.add(product)

    # If opening stock > 0, log an initial stock in movement
    if product_in.stock > 0:
        db.add(models.Movement(
            id=f"MOV-{int(time.time() * 1000)}",
            product=product.name,
            type="Stock in",
            qty=product.stock,
            date="Just now",
            reason="Opening catalog stock"
        ))

    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: str, product_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product_in.sku and product_in.sku.lower() != product.sku.lower():
        existing = db.query(models.Product).filter(models.Product.sku.ilike(product_in.sku)).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU must be unique.")

    update_data = product_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return None

@router.post("/{product_id}/adjust-stock", response_model=schemas.ProductResponse)
def adjust_stock(product_id: str, adjustment: schemas.StockAdjustment, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.stock + adjustment.delta < 0:
        raise HTTPException(status_code=400, detail="Stock out quantity cannot exceed available stock.")

    product.stock += adjustment.delta
    
    # Create movement record
    db.add(models.Movement(
        id=f"MOV-{int(time.time() * 1000)}",
        product=product.name,
        type=adjustment.type,
        qty=adjustment.delta,
        date="Just now",
        reason=adjustment.reason or "Stock adjustment"
    ))

    db.commit()
    db.refresh(product)
    return product
