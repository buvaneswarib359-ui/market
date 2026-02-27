export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode: string;
}

export interface SaleItem extends Product {
  quantity: number;
}

export interface Sale {
  id: number;
  total: number;
  timestamp: string;
  items_count: number;
}

export interface Stats {
  revenue: number;
  productCount: number;
  lowStockCount: number;
  recentSales: { total: number; timestamp: string }[];
}
