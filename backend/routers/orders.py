import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/orders", tags=["Purchase Orders"])

@router.get("", response_model=List[schemas.PurchaseOrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = db.query(models.PurchaseOrder).order_by(models.PurchaseOrder.created_at.desc()).all()
    # Format line items
    res = []
    for o in orders:
        lines = [
            schemas.PurchaseOrderLineSchema(productId=line.product_id, quantity=line.quantity)
            for line in o.lines
        ]
        res.append(schemas.PurchaseOrderResponse(
            id=o.id,
            supplier=o.supplier,
            status=o.status,
            received=o.received,
            lines=lines
        ))
    return res

@router.post("", response_model=schemas.PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.PurchaseOrderCreate, db: Session = Depends(get_db)):
    if not order_in.supplier.strip() or not order_in.lines:
        raise HTTPException(status_code=400, detail="Supplier and at least one order line are required.")

    count = db.query(models.PurchaseOrder).count()
    new_id = f"PO-{str(count + 1).zfill(3)}"
    while db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == new_id).first():
        count += 1
        new_id = f"PO-{str(count + 1).zfill(3)}"

    order = models.PurchaseOrder(
        id=new_id,
        supplier=order_in.supplier.strip(),
        status="Draft",
        received=False
    )
    db.add(order)
    db.flush()

    for line in order_in.lines:
        db.add(models.PurchaseOrderLine(
            order_id=order.id,
            product_id=line.productId,
            quantity=line.quantity
        ))

    db.commit()
    db.refresh(order)

    lines = [
        schemas.PurchaseOrderLineSchema(productId=line.product_id, quantity=line.quantity)
        for line in order.lines
    ]
    return schemas.PurchaseOrderResponse(
        id=order.id,
        supplier=order.supplier,
        status=order.status,
        received=order.received,
        lines=lines
    )

@router.post("/{order_id}/mark-ordered", response_model=schemas.PurchaseOrderResponse)
def mark_ordered(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found.")
    
    if order.status != "Draft":
        raise HTTPException(status_code=400, detail=f"Cannot mark order as ordered from status '{order.status}'.")

    order.status = "Ordered"
    db.commit()
    db.refresh(order)

    lines = [
        schemas.PurchaseOrderLineSchema(productId=line.product_id, quantity=line.quantity)
        for line in order.lines
    ]
    return schemas.PurchaseOrderResponse(
        id=order.id,
        supplier=order.supplier,
        status=order.status,
        received=order.received,
        lines=lines
    )

@router.post("/{order_id}/receive", response_model=schemas.PurchaseOrderResponse)
def receive_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.PurchaseOrder).filter(models.PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found.")

    if order.received or order.status == "Received":
        raise HTTPException(status_code=400, detail="This order has already been received.")

    # Automatically increment products stock and record movements
    for line in order.lines:
        product = db.query(models.Product).filter(
            (models.Product.id == line.product_id) | (models.Product.name == line.product_id)
        ).first()
        if product:
            product.stock += line.quantity
            db.add(models.Movement(
                id=f"MOV-{int(time.time() * 1000)}",
                product=product.name,
                type="Stock in",
                qty=line.quantity,
                date="Just now",
                reason=f"Purchase order {order.id} receiving"
            ))

    order.status = "Received"
    order.received = True
    db.commit()
    db.refresh(order)

    lines = [
        schemas.PurchaseOrderLineSchema(productId=line.product_id, quantity=line.quantity)
        for line in order.lines
    ]
    return schemas.PurchaseOrderResponse(
        id=order.id,
        supplier=order.supplier,
        status=order.status,
        received=order.received,
        lines=lines
    )
