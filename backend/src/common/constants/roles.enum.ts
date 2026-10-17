export enum PlatformRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  BUSINESS_USER = 'BUSINESS_USER',
}

export enum BusinessRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  INVENTORY_STAFF = 'INVENTORY_STAFF',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum BusinessCategory {
  RETAIL = 'Retail Shop',
  SUPERMARKET = 'Supermarket',
  PHARMACY = 'Pharmacy',
  RESTAURANT = 'Restaurant & Café',
  CLOTHING = 'Clothing & Fashion',
  ELECTRONICS = 'Electronics & Hardware',
  WHOLESALE = 'Wholesale Business',
  GENERAL_TRADING = 'General Trading',
  OTHER = 'Other Category',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export enum SaleType {
  CASH_SALE = 'CASH_SALE',
  CREDIT_SALE = 'CREDIT_SALE',
}

export enum DebtStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum InventoryMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  CREDIT_SALE = 'CREDIT_SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

export enum ReceiptType {
  CASH_SALE = 'CASH_SALE',
  CREDIT_SALE = 'CREDIT_SALE',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  CUSTOMER_STATEMENT = 'CUSTOMER_STATEMENT',
}

