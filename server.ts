import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("market.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    category TEXT,
    barcode TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    items_count INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price_at_sale REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, stock, category, barcode } = req.body;
    const info = db.prepare(
      "INSERT INTO products (name, price, stock, category, barcode) VALUES (?, ?, ?, ?, ?)"
    ).run(name, price, stock, category, barcode);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, price, stock, category, barcode } = req.body;
    db.prepare(
      "UPDATE products SET name = ?, price = ?, stock = ?, category = ?, barcode = ? WHERE id = ?"
    ).run(name, price, stock, category, barcode, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/sales", (req, res) => {
    const { items, total } = req.body;
    
    const transaction = db.transaction(() => {
      const saleInfo = db.prepare(
        "INSERT INTO sales (total, items_count) VALUES (?, ?)"
      ).run(total, items.length);
      
      const saleId = saleInfo.lastInsertRowid;
      
      const insertItem = db.prepare(
        "INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)"
      );
      const updateStock = db.prepare(
        "UPDATE products SET stock = stock - ? WHERE id = ?"
      );

      for (const item of items) {
        insertItem.run(saleId, item.id, item.quantity, item.price);
        updateStock.run(item.quantity, item.id);
      }
      
      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY timestamp DESC").all();
    res.json(sales);
  });

  app.get("/api/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total) as total FROM sales").get();
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get();
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock < 10").get();
    const recentSales = db.prepare("SELECT total, timestamp FROM sales ORDER BY timestamp DESC LIMIT 10").all();
    
    res.json({
      revenue: totalSales.total || 0,
      productCount: totalProducts.count,
      lowStockCount: lowStock.count,
      recentSales
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
