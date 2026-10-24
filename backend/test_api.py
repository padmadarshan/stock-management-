from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_suite():
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("[OK] Root check:", res.json()["name"], "-", res.json()["active_database"])

    # Test Login
    login_res = client.post("/api/auth/login", json={"email": "jordan@acmecampus.edu", "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    print("[OK] Auth Login check: Token received successfully")

    # Test Auth Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    print("[OK] Auth Profile check:", me_res.json()["name"], "-", me_res.json()["role"])

    # Test Products
    prod_res = client.get("/api/products")
    assert prod_res.status_code == 200
    products = prod_res.json()
    print(f"[OK] Products check: {len(products)} products retrieved")

    # Test Stock In
    adj_res = client.post("/api/products/PRD-001/adjust-stock", json={"delta": 5, "type": "Stock in", "reason": "Test intake"})
    assert adj_res.status_code == 200
    print(f"[OK] Stock adjustment check: PRD-001 stock is {adj_res.json()['stock']}")

    # Test Movements
    mov_res = client.get("/api/inventory/movements")
    assert mov_res.status_code == 200
    print(f"[OK] Movements check: {len(mov_res.json())} movement records")

    # Test Suppliers
    sup_res = client.get("/api/suppliers")
    assert sup_res.status_code == 200
    print(f"[OK] Suppliers check: {len(sup_res.json())} suppliers")

    # Test Dashboard KPIs
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    kpis = dash_res.json()["kpis"]
    print(f"[OK] Dashboard KPIs check: {kpis['total_products']} products, {kpis['stock_units']} units, Valuation: ${kpis['inventory_value']}")

    # Test Taxonomy
    cat_res = client.get("/api/taxonomy/categories")
    brand_res = client.get("/api/taxonomy/brands")
    assert cat_res.status_code == 200 and brand_res.status_code == 200
    print(f"[OK] Taxonomy check: {len(cat_res.json())} categories, {len(brand_res.json())} brands")

    # Test AI Assistant Endpoint
    ai_res = client.post("/api/analytics/assistant", json={"prompt": "What items need reordering?"})
    assert ai_res.status_code == 200
    print(f"[OK] AI Assistant check: Response generated ({len(ai_res.json()['reply'])} chars)")

    print("\n>>> ALL BACKEND API CHECKS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_suite()
