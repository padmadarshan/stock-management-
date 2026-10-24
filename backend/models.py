from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Administrator")
    created_at = Column(DateTime, default=datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    brand = Column(String(100), nullable=False, index=True)
    stock = Column(Integer, default=0, nullable=False)
    min = Column(Integer, default=1, nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    supplier = Column(String(150), nullable=False)
    location = Column(String(100), default="Store Room")
    barcode = Column(String(100), index=True, default="")
    expiry = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Movement(Base):
    __tablename__ = "movements"

    id = Column(String(50), primary_key=True, index=True)
    product = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # 'Stock in', 'Stock out', 'Adjustment', 'Transfer'
    qty = Column(Integer, nullable=False)
    date = Column(String(50), nullable=False)
    reason = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(50), default="")
    lead_time = Column(Integer, default=7)
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(50), primary_key=True, index=True)
    supplier = Column(String(150), nullable=False)
    status = Column(String(50), default="Draft")  # 'Draft', 'Ordered', 'Received'
    received = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    lines = relationship("PurchaseOrderLine", back_populates="order", cascade="all, delete-orphan")

class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(String(50), ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)

    order = relationship("PurchaseOrder", back_populates="lines")

class StockTransfer(Base):
    __tablename__ = "transfers"

    id = Column(String(50), primary_key=True, index=True)
    product = Column(String(150), nullable=False)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)

class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
