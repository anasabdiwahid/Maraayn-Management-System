import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:4000/api/v1';

describe('Maraayn Management System — End-to-End Workflows & Security', () => {
  let superAdminToken = '';
  let businessToken = '';
  let tenantId = '';
  let createdProductId = '';
  let createdCustomerId = '';
  let createdSaleId = '';
  let createdDebtId = '';
  let createdReceiptNumber = '';

  it('1. Should successfully log in Super Admin and return SUPER_ADMIN role', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'superadmin@maraayn.com',
        password: 'SuperAdmin@2026',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.accessToken).toBeDefined();
    expect(data.user.platformRole).toBe('SUPER_ADMIN');
    superAdminToken = data.accessToken;
  });

  it('2. Should reject invalid credentials with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'superadmin@maraayn.com',
        password: 'WrongPassword@123',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('3. Should successfully log in Business User and return Tenant Branding', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginIdentifier: 'albaraka@maraayn.com',
        password: 'Baraka@2026',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.platformRole).toBe('BUSINESS_USER');
    expect(data.tenant).toBeDefined();
    expect(data.tenant.name).toBe('Al-Baraka Supermarket');
    expect(data.tenant.storageQuotaBytes).toBe(4 * 1024 * 1024 * 1024);

    businessToken = data.accessToken;
    tenantId = data.tenant.id;
  });

  it('4. SECURITY & TENANT ISOLATION: Business user must be forbidden from platform admin endpoints', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });

    expect(res.status).toBe(403);
  });

  it('5. Should allow Super Admin to query Admin Dashboard stats', async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalMarkets).toBeGreaterThanOrEqual(2);
    expect(data.activeMarkets).toBeGreaterThanOrEqual(1);
    expect(data.totalAllocatedGb).toBeGreaterThan(0);
  });

  it('6. Should register a new product for the business with inventory tracking', async () => {
    const randomSku = `TEST-PROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        name: 'Tijaabo Caanaha Geela 1L',
        sku: randomSku,
        barcode: '1122334455667',
        category: 'Dairy',
        purchaseCost: 1.5,
        sellingPrice: 2.5,
        currentQuantity: 20,
        minStockAlert: 5,
        unit: 'bottle',
      }),
    });

    expect(res.status).toBe(201);
    const product = await res.json();
    expect(product._id).toBeDefined();
    expect(product.currentQuantity).toBe(20);
    createdProductId = product._id;
  });

  it('7. Should register a new customer in the business workspace', async () => {
    const randomPhone = `+25261${Math.floor(1000000 + Math.random() * 9000000)}`;
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        name: 'Guleed Warsame Cilmi',
        phone: randomPhone,
        email: 'guleed.test@gmail.com',
        address: 'Hodan, Mogadishu',
        openingBalance: 0,
      }),
    });

    expect(res.status).toBe(201);
    const customer = await res.json();
    expect(customer._id).toBeDefined();
    expect(customer.currentDebtBalance).toBe(0);
    createdCustomerId = customer._id;
  });

  it('8. CREDIT SALE WORKFLOW: Complete credit sale, deduct stock, create debt record and receipt', async () => {
    const res = await fetch(`${BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        saleType: 'CREDIT_SALE',
        customerId: createdCustomerId,
        customerName: 'Guleed Warsame Cilmi',
        paymentMethod: 'CASH',
        items: [
          {
            productId: createdProductId,
            quantity: 4, // Buy 4 bottles @ $2.5 = $10.0
          },
        ],
        amountPaid: 2.0, // Pays $2.0 down payment, remaining debt is $8.0
        notes: 'Test credit transaction',
      }),
    });

    expect(res.status).toBe(201);
    const result = await res.json();
    expect(result.success).toBe(true);
    expect(result.sale.grandTotal).toBe(10);
    expect(result.sale.amountPaid).toBe(2);
    expect(result.sale.balanceDue).toBe(8);
    expect(result.debt).toBeDefined();
    expect(result.debt.remainingBalance).toBe(8);
    expect(result.debt.status).toBe('PARTIALLY_PAID');
    expect(result.receipt.receiptNumber).toBeDefined();

    createdSaleId = result.sale._id;
    createdDebtId = result.debt._id;
    createdReceiptNumber = result.receipt.receiptNumber;

    // Verify product stock was reduced from 20 to 16
    const prodRes = await fetch(`${BASE_URL}/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });
    const prodData = await prodRes.json();
    expect(prodData.product.currentQuantity).toBe(16);

    // Verify customer debt balance is now $8
    const cusRes = await fetch(`${BASE_URL}/customers/${createdCustomerId}`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });
    const cusData = await cusRes.json();
    expect(cusData.customer.currentDebtBalance).toBe(8);
  });

  it('9. DEBT REPAYMENT (PARTIAL): Record $3 payment, balance becomes $5', async () => {
    const res = await fetch(`${BASE_URL}/debts/${createdDebtId}/repay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        amount: 3.0,
        paymentMethod: 'MOBILE_MONEY',
        reference: 'EVC-REF-12345',
        notes: 'Partial payment',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.debt.remainingBalance).toBe(5);
    expect(data.debt.amountRepaid).toBe(3);
    expect(data.debt.status).toBe('PARTIALLY_PAID');
    expect(data.customer.currentDebtBalance).toBe(5);
  });

  it('10. DEBT REPAYMENT (FULL SETTLEMENT): Record remaining $5 payment, debt becomes PAID with balance 0', async () => {
    const res = await fetch(`${BASE_URL}/debts/${createdDebtId}/repay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${businessToken}`,
      },
      body: JSON.stringify({
        amount: 5.0,
        paymentMethod: 'CASH',
        reference: 'Settlement in full',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.debt.remainingBalance).toBe(0);
    expect(data.debt.status).toBe('PAID');
    expect(data.customer.currentDebtBalance).toBe(0);
  });

  it('11. RECEIPT GENERATION & WHATSAPP SHARING: Should generate valid wa.me share link', async () => {
    const res = await fetch(`${BASE_URL}/receipts/${createdReceiptNumber}/whatsapp`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.waLink).toBeDefined();
    expect(data.waLink).toContain('https://wa.me/');
    expect(data.plainMessage).toContain('Al-Baraka Supermarket'.toUpperCase());
    expect(data.plainMessage).toContain(createdReceiptNumber);
  });

  it('12. STORAGE METERING: Should accurately retrieve business storage usage and quota bytes', async () => {
    const res = await fetch(`${BASE_URL}/tenant/storage`, {
      headers: { Authorization: `Bearer ${businessToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.quotaBytes).toBe(4 * 1024 * 1024 * 1024);
    expect(data.quotaGb).toBe(4);
    expect(data.isOverQuota).toBe(false);
  });
});

