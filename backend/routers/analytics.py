import io
import csv
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])

@router.get("/dashboard", response_model=schemas.DashboardResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    
    # Retrieve threshold
    threshold_record = db.query(models.Setting).filter(models.Setting.key == "threshold").first()
    threshold = 10
    if threshold_record:
        try:
            threshold = int(json.loads(threshold_record.value))
        except Exception:
            threshold = 10

    total_products = len(products)
    stock_units = sum(p.stock for p in products)
    inventory_value = sum(p.stock * p.price for p in products)
    low_stock_count = sum(1 for p in products if p.stock <= threshold)
    out_of_stock_count = sum(1 for p in products if p.stock == 0)

    recent_movements = db.query(models.Movement).order_by(models.Movement.created_at.desc(), models.Movement.id.desc()).limit(5).all()

    return {
        "kpis": {
            "total_products": total_products,
            "stock_units": stock_units,
            "inventory_value": round(inventory_value, 2),
            "low_stock_count": low_stock_count,
            "out_of_stock_count": out_of_stock_count
        },
        "recent_movements": recent_movements
    }

@router.get("/alerts")
def get_low_stock_alerts(threshold: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if threshold is None:
        threshold_record = db.query(models.Setting).filter(models.Setting.key == "threshold").first()
        threshold = 10
        if threshold_record:
            try:
                threshold = int(json.loads(threshold_record.value))
            except Exception:
                threshold = 10

    products = db.query(models.Product).filter(models.Product.stock <= threshold).all()
    return [
        {
            "product": p.name,
            "sku": p.sku,
            "stock": p.stock,
            "threshold": threshold,
            "status": "Out of stock" if p.stock == 0 else "Low stock"
        }
        for p in products
    ]

@router.get("/expiry")
def get_expiry_tracking(days: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if days is None:
        expiry_record = db.query(models.Setting).filter(models.Setting.key == "expiry").first()
        days = 30
        if expiry_record:
            try:
                days = int(json.loads(expiry_record.value))
            except Exception:
                days = 30

    products = db.query(models.Product).all()
    today = datetime.utcnow().date()

    results = []
    for p in products:
        status_text = "No expiry date"
        diff_days = None
        if p.expiry:
            try:
                exp_date = datetime.strptime(p.expiry, "%Y-%m-%d").date()
                diff_days = (exp_date - today).days
                if diff_days < 0:
                    status_text = "Expired"
                elif diff_days <= days:
                    status_text = "Expiring soon"
                else:
                    status_text = "Safe"
            except ValueError:
                status_text = "Invalid date"

        results.append({
            "id": p.id,
            "product": p.name,
            "expiry": p.expiry or "—",
            "daysRemaining": diff_days,
            "status": status_text
        })
    return results

@router.get("/export/{export_type}")
def export_csv(export_type: str, db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    if export_type == "products":
        products = db.query(models.Product).all()
        writer.writerow(["ID", "Name", "SKU", "Category", "Brand", "Stock", "Min", "Price", "Supplier", "Location", "Barcode", "Expiry"])
        for p in products:
            writer.writerow([p.id, p.name, p.sku, p.category, p.brand, p.stock, p.min, p.price, p.supplier, p.location, p.barcode, p.expiry or ""])
        filename = "stockwise-products.csv"
    elif export_type == "movements":
        movements = db.query(models.Movement).order_by(models.Movement.created_at.desc()).all()
        writer.writerow(["ID", "Product", "Type", "Quantity", "Date", "Reason"])
        for m in movements:
            writer.writerow([m.id, m.product, m.type, m.qty, m.date, m.reason])
        filename = "stockwise-movements.csv"
    elif export_type == "reports":
        products = db.query(models.Product).all()
        writer.writerow(["Product", "SKU", "Stock", "Unit Price", "Valuation"])
        for p in products:
            writer.writerow([p.name, p.sku, p.stock, p.price, round(p.stock * p.price, 2)])
        filename = "stockwise-inventory-report.csv"
    else:
        raise HTTPException(status_code=400, detail="Invalid export type. Valid types: products, movements, reports")

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/assistant")
def ai_inventory_assistant(req: schemas.PromptRequest, db: Session = Depends(get_db)):
    prompt = req.prompt.lower().strip()
    products = db.query(models.Product).all()
    suppliers = db.query(models.Supplier).all()
    movements = db.query(models.Movement).order_by(models.Movement.created_at.desc()).limit(10).all()

    threshold_record = db.query(models.Setting).filter(models.Setting.key == "threshold").first()
    threshold = 10
    if threshold_record:
        try:
            threshold = int(json.loads(threshold_record.value))
        except Exception:
            threshold = 10

    low_stock = [p for p in products if p.stock <= threshold]
    out_of_stock = [p for p in products if p.stock == 0]
    total_valuation = sum(p.stock * p.price for p in products)
    total_units = sum(p.stock for p in products)

    # Reorder suggestions
    reorder_list = []
    for p in low_stock:
        sup = next((s for s in suppliers if s.name == p.supplier), None)
        lead = sup.lead_time if sup else 7
        suggested_qty = max(p.min * 2 - p.stock, 10)
        reorder_list.append({
            "product": p.name,
            "sku": p.sku,
            "current_stock": p.stock,
            "min_required": p.min,
            "supplier": p.supplier,
            "suggested_order_qty": suggested_qty,
            "lead_time_days": lead
        })

    suggestions = [
        "What items need reordering?",
        "What is our total stock valuation?",
        "Which supplier is the fastest?",
        "Summarize overall inventory health"
    ]

    # Query routing logic
    if any(w in prompt for w in ["reorder", "order", "purchase", "low stock", "out of stock", "urgent"]):
        if not reorder_list:
            reply = f"Great news! All {len(products)} products currently maintain healthy inventory levels above the alert threshold ({threshold} units). No emergency reorders are needed right now."
        else:
            items_str = ", ".join([f"{r['product']} ({r['current_stock']} left, suggest ordering +{r['suggested_order_qty']} from {r['supplier']})" for r in reorder_list])
            reply = f"You have {len(reorder_list)} product(s) requiring attention: {items_str}. We recommend placing purchase orders soon to prevent stockouts."
        return {
            "reply": reply,
            "suggestions": suggestions,
            "recommendations": reorder_list
        }

    elif any(w in prompt for w in ["value", "valuation", "worth", "cost", "total"]):
        reply = (
            f"Your current catalog contains {len(products)} products with {total_units} total stock units. "
            f"The total calculated inventory valuation is ${total_valuation:,.2f} USD across all storage locations."
        )
        return {
            "reply": reply,
            "suggestions": suggestions,
            "recommendations": []
        }

    elif any(w in prompt for w in ["supplier", "vendor", "fast", "lead time"]):
        if not suppliers:
            reply = "There are no suppliers registered in the system."
        else:
            sorted_sup = sorted(suppliers, key=lambda s: s.lead_time)
            fastest = sorted_sup[0]
            slowest = sorted_sup[-1]
            reply = (
                f"You have {len(suppliers)} active suppliers. The fastest supplier is **{fastest.name}** with a {fastest.lead_time}-day lead time. "
                f"The longest lead time is **{slowest.name}** ({slowest.lead_time} days)."
            )
        return {
            "reply": reply,
            "suggestions": suggestions,
            "recommendations": []
        }

    else:
        # General overview
        reply = (
            f"Inventory Status Summary: {len(products)} products, {total_units} total units, valued at ${total_valuation:,.2f}. "
            f"{len(low_stock)} item(s) are at or below the minimum stock threshold of {threshold} units, "
            f"and {len(out_of_stock)} item(s) are completely out of stock. "
            f"Latest transaction was on {movements[0].product if movements else 'none'}."
        )
        return {
            "reply": reply,
            "suggestions": suggestions,
            "recommendations": reorder_list
        }

