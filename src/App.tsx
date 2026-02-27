import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Plus, 
  Search, 
  Trash2, 
  Minus, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';
import { Product, Sale, SaleItem, Stats } from './types';

type View = 'dashboard' | 'inventory' | 'pos' | 'history';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchSales();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/stats');
    const data = await res.json();
    setStats(data);
  };

  const fetchSales = async () => {
    const res = await fetch('/api/sales');
    const data = await res.json();
    setSales(data);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      showNotification('Product out of stock', 'error');
      return;
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        showNotification('Cannot exceed available stock', 'error');
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) {
          showNotification('Cannot exceed available stock', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total: cartTotal })
      });

      if (res.ok) {
        showNotification('Sale completed successfully');
        setCart([]);
        fetchProducts();
        fetchStats();
        fetchSales();
      } else {
        showNotification('Failed to complete sale', 'error');
      }
    } catch (err) {
      showNotification('Error processing checkout', 'error');
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      stock: parseInt(formData.get('stock') as string),
      category: formData.get('category') as string,
      barcode: formData.get('barcode') as string,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        showNotification('Product added successfully');
        setIsAddingProduct(false);
        fetchProducts();
        fetchStats();
      }
    } catch (err) {
      showNotification('Error adding product', 'error');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">MarketFlow</h1>
              <p className="text-xs text-slate-500 font-medium">Billing System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label="Point of Sale" 
            active={view === 'pos'} 
            onClick={() => setView('pos')} 
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Inventory" 
            active={view === 'inventory'} 
            onClick={() => setView('inventory')} 
          />
          <SidebarItem 
            icon={<History size={20} />} 
            label="Sales History" 
            active={view === 'history'} 
            onClick={() => setView('history')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Online & Synced
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <header className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                  <p className="text-slate-500 mt-1">Welcome back. Here's what's happening today.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400">Current Date</p>
                  <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Revenue" 
                  value={`$${stats?.revenue.toFixed(2) || '0.00'}`} 
                  icon={<TrendingUp className="text-indigo-600" />}
                  trend="+12.5%"
                />
                <StatCard 
                  title="Total Products" 
                  value={stats?.productCount.toString() || '0'} 
                  icon={<Package className="text-amber-600" />}
                />
                <StatCard 
                  title="Low Stock Items" 
                  value={stats?.lowStockCount.toString() || '0'} 
                  icon={<AlertCircle className={cn(stats?.lowStockCount ? "text-red-600" : "text-emerald-600")} />}
                  description={stats?.lowStockCount ? "Action required" : "All clear"}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Revenue Overview</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats?.recentSales.slice().reverse()}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="timestamp" 
                          hide 
                        />
                        <YAxis 
                          stroke="#94A3B8" 
                          fontSize={12} 
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          stroke="#4F46E5" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorTotal)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent Transactions</h3>
                  <div className="space-y-4">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                            <History size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Sale #{sale.id}</p>
                            <p className="text-xs text-slate-500">{new Date(sale.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">${sale.total.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">{sale.items_count} items</p>
                        </div>
                      </div>
                    ))}
                    {sales.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No transactions yet today</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'pos' && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="flex gap-8 h-[calc(100vh-160px)]">
                {/* Product Selection */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text"
                      placeholder="Search products by name or barcode..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-3 gap-4 pr-2 custom-scrollbar">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                        className={cn(
                          "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left transition-all hover:shadow-md hover:border-indigo-200 group relative overflow-hidden",
                          product.stock <= 0 && "opacity-60 grayscale cursor-not-allowed"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                            {product.category}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            product.stock < 10 ? "text-red-500" : "text-slate-400"
                          )}>
                            Stock: {product.stock}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{product.name}</h4>
                        <p className="text-lg font-black text-slate-900">${product.price.toFixed(2)}</p>
                        
                        <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-indigo-600" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cart / Billing */}
                <div className="w-[400px] bg-white border border-slate-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-lg">Current Order</h3>
                    <button 
                      onClick={() => setCart([])}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 group">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                          <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1 border border-slate-100">
                          <button 
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="w-20 text-right">
                          <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40 py-20">
                        <ShoppingCart size={64} strokeWidth={1} className="mb-4" />
                        <p className="font-medium">Your cart is empty</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Tax (0%)</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={20} />
                      Complete Checkout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Inventory</h2>
                  <p className="text-slate-500 mt-1">Manage your products and stock levels.</p>
                </div>
                <button 
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add New Product
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Barcode</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              product.stock < 10 ? "bg-red-500" : "bg-emerald-500"
                            )} />
                            <span className={cn(
                              "font-bold",
                              product.stock < 10 ? "text-red-600" : "text-slate-900"
                            )}>{product.stock}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">{product.barcode || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <header>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sales History</h2>
                <p className="text-slate-500 mt-1">A detailed log of all past transactions.</p>
              </header>

              <div className="grid grid-cols-1 gap-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Printer size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Order #{sale.id}</h4>
                        <p className="text-sm text-slate-500">
                          {new Date(sale.timestamp).toLocaleString('en-US', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Items</p>
                        <p className="font-bold text-slate-900">{sale.items_count}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <p className="text-2xl font-black text-indigo-600">${sale.total.toFixed(2)}</p>
                      </div>
                      <ChevronRight className="text-slate-300" />
                    </div>
                  </div>
                ))}
                {sales.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <History size={64} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-medium">No sales history found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Add New Product</h3>
                <button onClick={() => setIsAddingProduct(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Product Name</label>
                  <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Fresh Milk" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Price ($)</label>
                    <input name="price" type="number" step="0.01" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Initial Stock</label>
                    <input name="stock" type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                  <select name="category" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Dairy</option>
                    <option>Produce</option>
                    <option>Bakery</option>
                    <option>Meat</option>
                    <option>Beverages</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Barcode (Optional)</label>
                  <input name="barcode" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Scan or type barcode" />
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mt-4">
                  Save Product
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white",
              notification.type === 'success' ? "bg-emerald-600" : "bg-red-600"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
      )}>
        {icon}
      </span>
      <span className="font-bold text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" 
        />
      )}
    </button>
  );
}

function StatCard({ title, value, icon, trend, description }: { title: string, value: string, icon: React.ReactNode, trend?: string, description?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner">
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h4 className="text-3xl font-black text-slate-900">{value}</h4>
        {description && (
          <p className="text-xs font-medium text-slate-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
}
