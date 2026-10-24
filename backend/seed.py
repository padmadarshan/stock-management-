import json
import logging
from sqlalchemy.orm import Session
import models
from auth import get_password_hash

logger = logging.getLogger("stockwise.seed")

def seed_database(db: Session):
    # Seed Categories
    default_categories = ["Electronics", "Sensors", "Accessories", "Peripherals"]
    for cat_name in default_categories:
        if not db.query(models.Category).filter(models.Category.name == cat_name).first():
            db.add(models.Category(name=cat_name))

    # Seed Brands
    default_brands = ["Arduino", "Circuit Hub", "OfficeKart", "Logitech", "Keychron"]
    for brand_name in default_brands:
        if not db.query(models.Brand).filter(models.Brand.name == brand_name).first():
            db.add(models.Brand(name=brand_name))

    # Seed Suppliers
    default_suppliers = [
        {"id": "SUP-001", "name": "TechSource India", "email": "contact@techsource.demo", "phone": "+91 98765 11111", "lead_time": 7},
        {"id": "SUP-002", "name": "Circuit Hub", "email": "orders@circuithub.demo", "phone": "+91 98765 22222", "lead_time": 10},
        {"id": "SUP-003", "name": "OfficeKart", "email": "sales@officekart.demo", "phone": "+91 98765 33333", "lead_time": 5},
    ]
    for s in default_suppliers:
        if not db.query(models.Supplier).filter(models.Supplier.id == s["id"]).first():
            db.add(models.Supplier(**s))

    # Seed Products
    default_products = [
        {
            "id": "PRD-001", "name": "Arduino Uno", "sku": "ARD-UNO-R3", "category": "Electronics",
            "stock": 24, "min": 12, "price": 29.9, "supplier": "TechSource India",
            "location": "Lab A", "barcode": "890100000001", "brand": "Arduino"
        },
        {
            "id": "PRD-002", "name": "Temperature Sensor", "sku": "SEN-TMP-01", "category": "Sensors",
            "stock": 8, "min": 15, "price": 29.8, "supplier": "Circuit Hub",
            "location": "Lab A", "barcode": "890100000002", "expiry": "2027-02-14", "brand": "Circuit Hub"
        },
        {
            "id": "PRD-003", "name": "USB Cable", "sku": "CAB-USB-C-2M", "category": "Accessories",
            "stock": 0, "min": 20, "price": 8.5, "supplier": "OfficeKart",
            "location": "Store Room", "barcode": "890100000003", "brand": "OfficeKart"
        },
        {
            "id": "PRD-004", "name": "Wireless Mouse", "sku": "MOU-WLS-02", "category": "Peripherals",
            "stock": 42, "min": 10, "price": 29.97, "supplier": "OfficeKart",
            "location": "Store Room", "barcode": "890100000004", "brand": "Logitech"
        },
        {
            "id": "PRD-005", "name": "Mechanical Keyboard", "sku": "KEY-MECH-87", "category": "Peripherals",
            "stock": 6, "min": 8, "price": 89.9, "supplier": "TechSource India",
            "location": "Store Room", "barcode": "890100000005", "brand": "Keychron"
        }
    ]
    for p in default_products:
        if not db.query(models.Product).filter(models.Product.id == p["id"]).first():
            db.add(models.Product(**p))

    # Seed Movements
    default_movements = [
        {"id": "MOV-104", "product": "Wireless Mouse", "type": "Stock out", "qty": -12, "date": "Today, 10:42 AM", "reason": "Department Issue"},
        {"id": "MOV-103", "product": "Arduino Uno", "type": "Stock in", "qty": 20, "date": "Today, 09:18 AM", "reason": "Purchase order"},
        {"id": "MOV-102", "product": "Temperature Sensor", "type": "Adjustment", "qty": -4, "date": "Yesterday, 4:32 PM", "reason": "Cycle count"}
    ]
    for m in default_movements:
        if not db.query(models.Movement).filter(models.Movement.id == m["id"]).first():
            db.add(models.Movement(**m))

    # Seed Settings
    default_settings = {"threshold": 10, "expiry": 30, "dark": False}
    for k, v in default_settings.items():
        if not db.query(models.Setting).filter(models.Setting.key == k).first():
            db.add(models.Setting(key=k, value=json.dumps(v)))

    # Seed Default User
    default_user_email = "jordan@acmecampus.edu"
    if not db.query(models.User).filter(models.User.email == default_user_email).first():
        db.add(models.User(
            name="Jordan Davis",
            email=default_user_email,
            password_hash=get_password_hash("password123"),
            role="Administrator"
        ))

    db.commit()
    logger.info("StockWise database initialized and seeded successfully.")
