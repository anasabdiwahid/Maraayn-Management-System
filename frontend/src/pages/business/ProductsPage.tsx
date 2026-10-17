import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  SlidersHorizontal,
  AlertTriangle,
  X,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.js';
import { Product } from '../../types/index.js';

export const ProductsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatus, setStockStatus] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const currency = tenant?.currencySymbol || '$';

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'General',
    purchaseCost: 0,
    sellingPrice: 0,
    currentQuantity: 0,
    minStockAlert: 5,
    unit: 'pcs',
    supplier: '',
    description: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          search: search || undefined,
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          stockStatus: stockStatus !== 'ALL' ? stockStatus : undefined,
        },
      });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setAddModalOpen(false);
      setEditProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await api.patch(`/products/${selectedProduct._id}/adjust-stock`, {
        quantityDelta: adjustmentDelta,
        reason: adjustmentReason,
      });
      setAdjustModalOpen(false);
      setSelectedProduct(null);
      setAdjustmentDelta(0);
      setAdjustmentReason('');
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: 'General',
      purchaseCost: 0,
      sellingPrice: 0,
      currentQuantity: 0,
      minStockAlert: 5,
      unit: 'pcs',
      supplier: '',
      description: '',
    });
  };

  const openEditModal = (p: Product) => {
    setEditProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category,
      purchaseCost: p.purchaseCost,
      sellingPrice: p.sellingPrice,
      currentQuantity: p.currentQuantity,
      minStockAlert: p.minStockAlert,
      unit: p.unit,
      supplier: p.supplier || '',
      description: p.description || '',
    });
    setAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#142746] tracking-tight">
            Products & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register products, track inventory stock levels, and monitor low-stock alerts
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditProduct(null);
            setAddModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-light text-brand-navy font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm self-start"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber focus:bg-white"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">Product / SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Selling Price</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading products, please wait...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found. Click "Add New Product" to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentQuantity <= p.minStockAlert;
                  const isOut = p.currentQuantity <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {p.sku} {p.barcode ? `• Barcode: ${p.barcode}` : ''}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {currency}{p.sellingPrice}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {currency}{p.purchaseCost}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {p.currentQuantity} {p.unit}
                          </span>
                          {isLow && !isOut && (
                            <span className="text-[10px] text-amber-600 font-semibold flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-0.5" /> Low
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustmentDelta(0);
                            setAdjustmentReason('');
                            setAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                          title="Adjust Stock"
                        >
                          Adjust Stock
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Caafi, Milk 1L, Rice 25kg"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142746] focus:bg-white text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Price ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: Number(e.target.value),
                        purchaseCost: formData.purchaseCost || Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142746] focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs">
                  Quantity in Stock (Inta Xabo ee Taalla) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.currentQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, currentQuantity: Number(e.target.value) })
                  }
                  placeholder="0"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#142746] focus:bg-white text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tirada xabbadood ee hadda kugu jira bakhaarka ama dukaanka
                </span>
              </div>

              <div className="mt-6 flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl font-bold transition-all shadow-md shadow-brand-navy/20"
                >
                  {editProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Adjust Stock: {selectedProduct.name}
              </h3>
              <button onClick={() => setAdjustModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3 text-xs">
              <p className="text-slate-500">
                Current stock: <span className="font-bold text-slate-800">{selectedProduct.currentQuantity} {selectedProduct.unit}</span>
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity to add or subtract (+ / -)
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
                  placeholder="e.g., +10 or -3"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Use positive numbers (+) for incoming stock, or negative (-) for damage/loss.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., New stock arrival, damaged goods, audit..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="mt-5 flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-navy hover:bg-brand-navy-light text-white rounded-xl font-bold transition-colors"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

