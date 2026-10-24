from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/taxonomy", tags=["Categories & Brands"])

# Categories
@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(models.Category).order_by(models.Category.name.asc()).all()
    return [c.name for c in cats]

@router.post("/categories", response_model=str, status_code=status.HTTP_201_CREATED)
def add_category(cat_in: schemas.TaxonomyCreate, db: Session = Depends(get_db)):
    name = cat_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name cannot be empty.")
    
    existing = db.query(models.Category).filter(models.Category.name.ilike(name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists.")

    new_cat = models.Category(name=name)
    db.add(new_cat)
    db.commit()
    return new_cat.name

@router.delete("/categories/{name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(name: str, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.name == name).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found.")

    # Check if assigned to any product
    assigned = db.query(models.Product).filter(models.Product.category == name).count()
    if assigned > 0:
        raise HTTPException(status_code=400, detail=f"Reassign products before deleting this category ({assigned} products assigned).")

    db.delete(cat)
    db.commit()
    return None

# Brands
@router.get("/brands", response_model=List[str])
def get_brands(db: Session = Depends(get_db)):
    brands = db.query(models.Brand).order_by(models.Brand.name.asc()).all()
    return [b.name for b in brands]

@router.post("/brands", response_model=str, status_code=status.HTTP_201_CREATED)
def add_brand(brand_in: schemas.TaxonomyCreate, db: Session = Depends(get_db)):
    name = brand_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Brand name cannot be empty.")

    existing = db.query(models.Brand).filter(models.Brand.name.ilike(name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand already exists.")

    new_brand = models.Brand(name=name)
    db.add(new_brand)
    db.commit()
    return new_brand.name

@router.delete("/brands/{name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(name: str, db: Session = Depends(get_db)):
    brand = db.query(models.Brand).filter(models.Brand.name == name).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found.")

    # Check if assigned to any product
    assigned = db.query(models.Product).filter(models.Product.brand == name).count()
    if assigned > 0:
        raise HTTPException(status_code=400, detail=f"Reassign products before deleting this brand ({assigned} products assigned).")

    db.delete(brand)
    db.commit()
    return None
