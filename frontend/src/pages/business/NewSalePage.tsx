import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  DollarSign,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  Tag,
  Coffee,
  Soup,
  CakeSlice,
  Cookie,
  CupSoda,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api, { resolveApiAssetUrl } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Product, Customer } from '../../types/index.js';
import { ReceiptModal } from '../../components/common/ReceiptModal.js';
import { formatMoney } from '../../utils/format.js';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export const NewSalePage: React.FC = () => {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<'CASH_SALE' | 'CREDIT_SALE'>('CASH_SALE');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'OTHER'>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);

  const currency = tenant?.currencySymbol || '$';

  useEffect(() => {
    // Load products
    api.get('/products', { params: { limit: 100 } }).then((res) => {
      setProducts(res.data.data || []);
    });

    // Load customers
    api.get('/customers', { params: { limit: 100 } }).then((res) => {
      setCustomers(res.data.data || []);
    });
  }, []);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchProduct));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  const getCategoryIcon = (category: string) => {
    const normalized = category.toLowerCase();
    if (category === 'ALL') return LayoutGrid;
    if (normalized.includes('drink') || normalized.includes('beverage') || normalized.includes('cabitaan')) return CupSoda;
    if (normalized.includes('dessert') || normalized.includes('macmacaan')) return CakeSlice;
    if (normalized.includes('snack') || normalized.includes('cunto fudud')) return Cookie;
    if (normalized.includes('starter') || normalized.includes('soup')) return Soup;
    if (normalized.includes('coffee') || normalized.includes('shaah')) return Coffee;
    return Tag;
  };

  const addToCart = (product: Product) => {
    if (product.currentQuantity <= 0) {
      alert(`Badeecada "${product.name}" hadda kuma jirto kaydka!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentQuantity) {
          alert(`Kaydka wax ka badan ma gadan kartid. Waxaa haray: ${product.currentQuantity}`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item,
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === productId) {
          if (qty > item.product.currentQuantity) {
            alert(`Kaydka waxaa ku haray kaliya ${item.product.currentQuantity}`);
            return item;
          }
          return {
            ...item,
            quantity: qty,
            total: qty * item.unitPrice - item.discount,
          };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const grandTotal = subtotal;

  // Sync amountPaid if Cash Sale
  useEffect(() => {
    if (saleType === 'CASH_SALE') {
      setAmountPaid(grandTotal);
    }
  }, [saleType, grandTotal]);

  const remainingBalance = Math.max(0, grandTotal - amountPaid);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    const cus = customers.find((c) => c._id === customerId);
    if (cus) {
      setCustomerName(cus.name);
      setCustomerPhone(cus.phone);
    } else {
      setCustomerName(saleType === 'CREDIT_SALE' ? '' : 'Walk-in Customer');
      setCustomerPhone('');
    }
  };

  const handleCompleteSale = async () => {
    setInlineError(null);
    setInlineSuccess(null);

    if (cart.length === 0) {
      setInlineError('Fadlan ku dar ugu yaraan hal badeeco cart-ka!');
      return;
    }

    const trimmedName = customerName === 'Walk-in Customer' && saleType === 'CREDIT_SALE' ? '' : customerName.trim();
    if (saleType === 'CREDIT_SALE' && !selectedCustomer && !trimmedName && !customerPhone.trim()) {
      setInlineError('Daynta waa in lagu qoraa magaca qofka ama taleefankiisa.');
      return;
    }

    setSubmitting(true);
    try {
      const finalCustomerName = trimmedName || (selectedCustomer ? customers.find((c) => c._id === selectedCustomer)?.name : '') || 'Macmiil Dayn';

      const payload = {
        saleType,
        customerId: selectedCustomer || undefined,
        customerName: finalCustomerName,
        customerPhone: customerPhone.trim(),
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.product._id,
          productName: i.product.name,
          sku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.product.purchaseCost,
          discount: i.discount,
          total: i.total,
        })),
        amountPaid: Number(amountPaid),
        dueDate: dueDate || undefined,
        notes: saleNotes,
      };

      const res = await api.post('/sales', payload);

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      if (res.data.consolidated) {
        setInlineSuccess(`Iibkan cusub waxaa si toos ah loogu kordhiyay recite-kii hore ee #${res.data.sale.receiptNumber}.`);
      }

      // Prepare receipt preview modal
      setGeneratedReceipt({
        receiptNumber: res.data.sale.receiptNumber,
        receiptType: saleType,
        customerName: res.data.sale.customerName || finalCustomerName,
        customerPhone: res.data.sale.customerPhone || customerPhone,
        items: res.data.sale.items,
        grandTotal: res.data.sale.grandTotal,
        amountPaid: res.data.sale.amountPaid,
        balanceRemaining: res.data.sale.balanceDue,
        paymentMethod,
        notes: res.data.sale.notes || saleNotes,
        createdAt: res.data.sale.createdAt || new Date().toISOString(),
      });

      setReceiptModalOpen(true);

      // Reset Cart
      setCart([]);
      setAmountPaid(0);
      setSaleNotes('');
      setDueDate('');
      if (saleType === 'CREDIT_SALE') {
        setSelectedCustomer('');
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
      }

      // Refresh product quantities and customers
      api.get('/products', { params: { limit: 100 } }).then((r) => setProducts(r.data.data || []));
      api.get('/customers', { params: { limit: 100 } }).then((r) => setCustomers(r.data.data || []));
    } catch (err: any) {
      setInlineError(err.response?.data?.message || 'Khalad ayaa dhacay inta lagu guda jiray diiwaangelinta iibka');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Title */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-brand-amber">
        <div>
          <h1 className="text-xl font-extrabold text-brand-navy tracking-tight">
            New Sale (Point of Sale — POS)
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">
            Select products, choose payment terms (Cash or Credit), and issue receipts
          </p>
        </div>
      </div>

      {/* POS Two-Column Grid: Left Catalog, Right Shopping Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Side: Product Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Category Pills */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search product name, SKU, or barcode (scanner supported)..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs transition focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
              />
            </div>

            {/* Category tiles */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-[10px] font-semibold text-slate-600">
              {categories.map((cat) => (
                (() => {
                  const CategoryIcon = getCategoryIcon(cat);
                  const selected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex min-w-[62px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2 transition-all ${
                        selected
                          ? 'border-brand-amber bg-amber-50 text-brand-navy shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <CategoryIcon className="h-4 w-4" />
                      <span className="max-w-24 truncate">{cat === 'ALL' ? 'Dhammaan' : cat}</span>
                    </button>
                  );
                })()
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          <div className="mb-2 flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Alaabta la heli karo</h2>
              <p className="mt-0.5 text-[10px] text-slate-400">Taabo alaabta si aad ugu darto iibka</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">{filteredProducts.length} alaab</span>
          </div>
          <div className="grid max-h-[680px] grid-cols-2 gap-2.5 overflow-y-auto pr-1 pb-1 sm:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const inStock = p.currentQuantity > 0;
              return (
                <div
                  key={p._id}
                  onClick={() => inStock && addToCart(p)}
                  role="button"
                  tabIndex={inStock ? 0 : -1}
                  onKeyDown={(event) => {
                    if (inStock && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      addToCart(p);
                    }
                  }}
                  aria-label={`${p.name}, ${currency}${formatMoney(p.sellingPrice)}. Ku dar iibka.`}
                  className={`group overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 ${
                    inStock
                      ? 'border-slate-200 hover:-translate-y-0.5 hover:border-brand-amber hover:shadow-md cursor-pointer'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="relative flex h-20 items-center justify-center overflow-hidden bg-slate-50 sm:h-24">
                    {p.imageUrl ? (
                      <img
                        src={resolveApiAssetUrl(p.imageUrl)}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-navy shadow-sm">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] font-bold shadow-sm ${inStock ? 'bg-white/95 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {inStock ? `${p.currentQuantity} ${p.unit}` : 'Ma jiro'}
                    </span>
                  </div>
                  <div className="p-2.5 sm:p-3">
                    <span className="block truncate text-[8px] font-mono font-semibold uppercase tracking-wide text-slate-400">{p.sku}</span>
                    <h4 className="mt-0.5 min-h-8 line-clamp-2 text-[11px] font-bold leading-4 text-slate-800 group-hover:text-brand-navy">{p.name}</h4>
                    <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
                      <span className="text-xs font-black text-brand-navy">{currency}{formatMoney(p.sellingPrice)}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${inStock ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Plus className="h-3 w-3" /> Ku dar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Cart, Customer Picker & Payment (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy/5">
                <ShoppingCart className="w-4 h-4 text-brand-navy" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
            {cart.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center px-5 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-600">Cart is empty</p>
                <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-slate-400">Select products on the left to add items to this sale.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product._id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h5 className="font-bold text-slate-800 truncate">{item.product.name}</h5>
                    <p className="text-[10px] text-slate-500">
                      {currency}{formatMoney(item.unitPrice)} / {item.product.unit}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => updateCartQuantity(item.product._id, item.quantity - 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product._id, item.quantity + 1)}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-16 text-right font-bold text-slate-900 shrink-0 ml-2">
                    {currency}{formatMoney(item.total)}
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="p-1 ml-1 text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Sale Type Selector (Cash vs Credit) */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">
              Nooca Iibka
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSaleType('CASH_SALE')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                  saleType === 'CASH_SALE'
                    ? 'bg-brand-navy text-white border-brand-navy shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Lacag Caddaan</span>
              </button>

              <button
                type="button"
                onClick={() => setSaleType('CREDIT_SALE')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                  saleType === 'CREDIT_SALE'
                    ? 'bg-brand-amber text-brand-navy border-brand-amber shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Dayn</span>
              </button>
            </div>
            {saleType === 'CREDIT_SALE' && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-900">
                Iibkan dayn ayuu noqonayaa markaad xaqiijiso. Alaabta kaydka waa laga jarayaa, dayntana macmiilka ayaa loo diiwaangelinayaa.
              </p>
            )}
          </div>

          {/* Customer Selection & Direct Name/Phone Input */}
          <div className="space-y-2 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Customer {saleType === 'CREDIT_SALE' && <span className="text-rose-500">* (Magaca Macmiilka)</span>}
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-amber text-xs"
              >
                <option value="">-- Dooro Macmiil Diwaangashan (Ama toos u qor hoos) --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.phone || 'No phone'}) {c.currentDebtBalance > 0 ? `— Dayn Hore: ${currency}${c.currentDebtBalance}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Inputs for Name & Phone (Especially for Credit Sales) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Magaca Macmiilka {saleType === 'CREDIT_SALE' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder="Geli magaca macmiilka..."
                  value={customerName === 'Walk-in Customer' && saleType === 'CREDIT_SALE' ? '' : customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (selectedCustomer) setSelectedCustomer('');
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                  Taleefanka (Phone)
                </label>
                <input
                  type="text"
                  placeholder="Tusaale: 061XXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-amber"
                />
              </div>
            </div>

            {/* Existing Debt Info Alert if Selected Customer Has Previous Debt */}
            {saleType === 'CREDIT_SALE' && selectedCustomer && (() => {
              const cus = customers.find((c) => c._id === selectedCustomer);
              if (cus && cus.currentDebtBalance > 0) {
                return (
                  <div className="p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] font-medium leading-tight">
                    ℹ Macmiilkani wuxuu leeyahay dayn hore oo ah <strong>{currency}{cus.currentDebtBalance}</strong>. Dayntan cusub waxaa lagu kordhin doonaa <strong>recite-kiisii hore</strong>.
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Credit Sale Fields: Down Payment & Optional Due Date */}
          {saleType === 'CREDIT_SALE' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5 text-xs">
              <div>
                <label className="block font-bold text-amber-900 mb-1">
                  Down Payment Amount (Qaddarka la bixiyay hadda)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={grandTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-amber-950">
                    Payment Due Date (Waqtiga dib u soo celinta)
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/60 px-1.5 py-0.5 rounded">
                    Ikhtiyaari (Optional)
                  </span>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-between font-bold pt-1 text-rose-700 border-t border-amber-200">
                <span>Remaining Debt Recorded:</span>
                <span>{currency}{remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
            >
              <option value="CASH">Cash</option>
              <option value="MOBILE_MONEY">Mobile Money (EVC / Zaad / Sahal / M-Pesa)</option>
              <option value="BANK_TRANSFER">Bank Transfer / Remittance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Totals Summary */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Wadarta Guud:</span>
              <span className="text-base font-extrabold text-brand-navy">{currency}{formatMoney(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Hadda La Bixiyay:</span>
              <span className="font-bold text-emerald-600">{currency}{formatMoney(amountPaid)}</span>
            </div>
            {saleType === 'CREDIT_SALE' && remainingBalance > 0 && (
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-rose-600">
                <span>Daynta Hadhay:</span>
                <span>{currency}{formatMoney(remainingBalance)}</span>
              </div>
            )}
          </div>

          {/* Inline Error & Success Banners */}
          {inlineError && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{inlineError}</span>
              </div>
              <button
                type="button"
                onClick={() => setInlineError(null)}
                className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {inlineSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{inlineSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setInlineSuccess(null)}
                className="text-emerald-500 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            onClick={handleCompleteSale}
            disabled={submitting || cart.length === 0}
            className="w-full py-3 bg-brand-amber hover:brightness-95 active:scale-[0.99] text-brand-navy font-extrabold text-sm rounded-xl shadow-md shadow-brand-amber/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span>Waa la diiwaangelinayaa...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {saleType === 'CREDIT_SALE' ? 'Xaqiiji oo Diiwaangeli Daynta' : 'Dhammee Iibka'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Branded Receipt Modal with Print and WhatsApp Share */}
      {generatedReceipt && (
        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          receiptData={generatedReceipt}
        />
      )}
    </div>
  );
};

