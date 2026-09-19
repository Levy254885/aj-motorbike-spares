export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'STOREKEEPER';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  totalSpent: number;
  transactionCount: number;
  lastPurchaseAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  brand?: string;
  compatibleModels: string[];
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStockLevel: number;
  supplierId?: string;
  supplierName?: string;
  shelfLocation?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type StockMovementType =
  | 'STOCK_RECEIVED'
  | 'SALE'
  | 'STOCK_ADJUSTMENT'
  | 'DAMAGED'
  | 'LOST'
  | 'RETURNED'
  | 'MANUAL_CORRECTION'
  | 'PURCHASE'
  | 'REFUND';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  userName: string;
  reason?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'OTHER';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  buyingPrice: number;
  lineTotal: number;
  lineProfit: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  cashierId: string;
  cashierName: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIAL_REFUND' | 'CANCELLED';
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'SYSTEM' | 'SALE';
  title: string;
  message: string;
  read: boolean;
  productId?: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  logoUrl?: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxRate: number;
  receiptFooter: string;
  defaultMinimumStock: number;
  updatedAt: string;
  updatedBy: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
