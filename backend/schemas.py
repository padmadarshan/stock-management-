from typing import Optional, List, Literal
from pydantic import BaseModel, Field, EmailStr

# Auth & User Schemas
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    category: str
    brand: str
    stock: int = Field(default=0, ge=0)
    min: int = Field(default=1, ge=0)
    price: float = Field(default=0.0, ge=0.0)
    supplier: str
    location: str = "Store Room"
    barcode: Optional[str] = ""
    expiry: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    stock: Optional[int] = Field(default=None, ge=0)
    min: Optional[int] = Field(default=None, ge=0)
    price: Optional[float] = Field(default=None, ge=0.0)
    supplier: Optional[str] = None
    location: Optional[str] = None
    barcode: Optional[str] = None
    expiry: Optional[str] = None

class ProductResponse(ProductBase):
    id: str

    class Config:
        from_attributes = True

class StockAdjustment(BaseModel):
    delta: int
    type: Literal["Stock in", "Stock out", "Adjustment", "Transfer"] = "Adjustment"
    reason: str = "Manual adjustment"

# Movement Schemas
class MovementCreate(BaseModel):
    product: str
    type: Literal["Stock in", "Stock out", "Adjustment", "Transfer"]
    qty: int
    date: Optional[str] = None
    reason: Optional[str] = "Inventory transaction"

class MovementResponse(BaseModel):
    id: str
    product: str
    type: str
    qty: int
    date: str
    reason: str

    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    leadTime: int = Field(default=7, alias="lead_time")

    class Config:
        populate_by_name = True

class SupplierResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    leadTime: int = Field(alias="lead_time")

    class Config:
        from_attributes = True
        populate_by_name = True

# Purchase Order Schemas
class PurchaseOrderLineSchema(BaseModel):
    productId: str = Field(alias="product_id")
    quantity: int = Field(..., gt=0)

    class Config:
        from_attributes = True
        populate_by_name = True

class PurchaseOrderCreate(BaseModel):
    supplier: str
    lines: List[PurchaseOrderLineSchema]

class PurchaseOrderResponse(BaseModel):
    id: str
    supplier: str
    status: str
    received: bool
    lines: List[PurchaseOrderLineSchema]

    class Config:
        from_attributes = True
        populate_by_name = True

# Transfer Schemas
class TransferCreate(BaseModel):
    product: str
    fromLocation: str = Field(..., alias="from")
    toLocation: str = Field(..., alias="to")
    quantity: int = Field(..., gt=0)

    class Config:
        populate_by_name = True

class TransferResponse(BaseModel):
    id: str
    product: str
    fromLocation: str = Field(alias="from_location")
    toLocation: str = Field(alias="to_location")
    quantity: int

    class Config:
        from_attributes = True
        populate_by_name = True

# Taxonomy Schemas
class TaxonomyCreate(BaseModel):
    name: str

class TaxonomyResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# Settings Schema
class SettingsSchema(BaseModel):
    threshold: int = 10
    expiry: int = 30
    dark: bool = False

# Analytics & Dashboard Schemas
class DashboardKPIs(BaseModel):
    total_products: int
    stock_units: int
    inventory_value: float
    low_stock_count: int
    out_of_stock_count: int

class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    recent_movements: List[MovementResponse]

class PromptRequest(BaseModel):
    prompt: str
