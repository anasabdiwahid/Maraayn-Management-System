export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  platformRole: 'SUPER_ADMIN' | 'ADMIN' | 'BUSINESS_USER';
  businessRole?: 'OWNER' | 'MANAGER' | 'CASHIER' | 'INVENTORY_STAFF' | 'ACCOUNTANT' | null;
  tenantId?: string | null;
  permissions: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

export interface ReceiptSettings {
  receiptTitle: string;
  footerMessage: string;
  showPhone: boolean;
  showAddress: boolean;
  showLogo: boolean;
  paperSize: 'thermal-80mm' | 'thermal-58mm' | 'a4';
}

export interface Tenant {
  id: string;
  _id?: string;
  name: string;
  businessCode: string;
  category: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  location?: string;
  address?: string;
  country?: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
  storageQuotaBytes: number;
  storageUsedBytes: number;
  isOverQuota: boolean;
  suspensionReason?: string;
  subscriptionPlan?: string;
  receiptSettings: ReceiptSettings;
}

export interface Product {
  _id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  imageUrl?: string;
  purchaseCost: number;
  sellingPrice: number;
  currentQuantity: number;
  minStockAlert: number;
  unit: string;
  supplier?: string;
  expiryDate?: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface Customer {
  _id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  code?: string;
  openingBalance: number;
  currentDebtBalance: number;
  totalPurchases: number;
  totalPaid: number;
  notes?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  total: number;
}

export interface Sale {
  _id: string;
  tenantId: string;
  saleNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'OTHER';
  saleType: 'CASH_SALE' | 'CREDIT_SALE';
  paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

export interface DebtPaymentHistory {
  paymentId?: string;
  amount: number;
  date: string;
  method: string;
  reference?: string;
  balanceAfter: number;
}

export interface Debt {
  _id: string;
  tenantId: string;
  debtNumber: string;
  customerId: Customer | string;
  saleId: Sale | string;
  saleDate: string;
  totalSaleAmount: number;
  initialPayment: number;
  amountRepaid: number;
  remainingBalance: number;
  dueDate?: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  transactionHistory: DebtPaymentHistory[];
  notes?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  tenantId: string;
  paymentNumber: string;
  saleId?: string;
  debtId?: string;
  customerId?: Customer | string;
  amount: number;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'OTHER';
  paymentDate: string;
  reference?: string;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  _id: string;
  tenantId: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  description?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface Receipt {
  _id: string;
  tenantId: string;
  receiptNumber: string;
  receiptType: 'CASH_SALE' | 'CREDIT_SALE' | 'DEBT_PAYMENT' | 'CUSTOMER_STATEMENT';
  referenceId?: string;
  customerName?: string;
  customerPhone?: string;
  items: any[];
  subtotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceRemaining: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

