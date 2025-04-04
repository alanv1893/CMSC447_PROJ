const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

const cors = require('cors')
app.use(cors())

app.use(express.json());

// Test route to confirm server is working
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Get all inventory items
app.get('/inventory', (req, res) => {
  db.all('SELECT * FROM inventory', (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows);
  });
});

// Get all vendors
app.get('/vendors', (req, res) => {
  db.all('SELECT vendor FROM vendors', (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows.map(row => row.vendor));
  });
});

// Create a new vendor
app.post('/vendors', (req, res) => {
  const { vendor } = req.body;
  if (!vendor) return res.status(400).send('Missing vendor name');

  db.run('INSERT INTO vendors (vendor) VALUES (?)', [vendor], function (err) {
    if (err) return res.status(500).send('DB Error or vendor already exists');
    res.send({ id: this.lastID, vendor });
  });
});

// Get all categories
app.get('/categories', (req, res) => {
  db.all('SELECT category FROM categories', (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows.map(row => row.category));
  });
});

// Create a new category
app.post('/categories', (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).send('Missing category name');

  db.run('INSERT INTO categories (category) VALUES (?)', [category], function (err) {
    if (err) return res.status(500).send('DB Error or category already exists');
    res.send({ id: this.lastID, category });
  });
});

// Get all brands
app.get('/brands', (req, res) => {
  db.all('SELECT brand_name FROM brands', (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows.map(row => row.brand_name));
  });
});

// Create a new brand
app.post('/brands', (req, res) => {
  const { brand_name } = req.body;
  if (!brand_name) return res.status(400).send('Missing brand name');

  db.run('INSERT INTO brands (brand_name) VALUES (?)', [brand_name], function (err) {
    if (err) return res.status(500).send('DB Error or brand already exists');
    res.send({ id: this.lastID, brand_name });
  });
});

// Add new item and update inventory
app.post('/items', (req, res) => {
  const { productname, cost, category, vendor, brand_name, quantity } = req.body;
  if (!productname || !cost || !category || !vendor || !brand_name || !quantity) {
    return res.status(400).send('Missing required fields');
  }

  // Helper function to get or insert into a table
  function getOrInsert(table, column, value, callback) {
    db.get(`SELECT id FROM ${table} WHERE ${column} = ?`, [value], (err, row) => {
      if (err) return callback(err);
      if (row) return callback(null, row.id);
      db.run(`INSERT INTO ${table} (${column}) VALUES (?)`, [value], function (err) {
        if (err) return callback(err);
        callback(null, this.lastID);
      });
    });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    getOrInsert('categories', 'category', category, (err, category_id) => {
      if (err) return db.run('ROLLBACK', () => res.status(500).send('Category error'));

      getOrInsert('vendors', 'vendor', vendor, (err, vendor_id) => {
        if (err) return db.run('ROLLBACK', () => res.status(500).send('Vendor error'));

        getOrInsert('brands', 'brand_name', brand_name, (err, brand_id) => {
          if (err) return db.run('ROLLBACK', () => res.status(500).send('Brand error'));

          db.run(`INSERT INTO items (productname, cost, vendor_id, category_id, brand_id)
                  VALUES (?, ?, ?, ?, ?)`, 
            [productname, cost, vendor_id, category_id, brand_id], 
            function (err) {
              if (err) return db.run('ROLLBACK', () => res.status(500).send('Item insert error'));

              const item_id = this.lastID;

              db.run(`INSERT INTO inventory (item_id, quantity)
                      VALUES (?, ?)`, 
                [item_id, quantity], 
                function (err) {
                  if (err) return db.run('ROLLBACK', () => res.status(500).send('Inventory insert error'));

                  db.run('COMMIT');
                  res.send({ message: 'Item and inventory added successfully', item_id });
                });
            });
        });
      });
    });
  });
});

// Get all items by category name
app.get('/items/category/:category', (req, res) => {
  const { category } = req.params;

  const sql = `
    SELECT items.*
    FROM items
    JOIN categories ON items.category_id = categories.id
    WHERE categories.category = ?
  `;

  db.all(sql, [category], (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows);
  });
});

// Create a new cart
app.post('/carts', (req, res) => {
  db.run(`INSERT INTO carts (status) VALUES ('pending')`, function (err) {
    if (err) return res.status(500).send('Error creating cart');
    res.send({ cart_id: this.lastID });
  });
});

// Add an item to a specific cart
app.post('/cart-items', (req, res) => {
  const { cart_id, productname, quantity } = req.body;
  if (!cart_id || !productname || !quantity) {
    return res.status(400).send('Missing required fields');
  }

  db.run(`INSERT INTO cart_items (cart_id, productname, quantity) VALUES (?, ?, ?)`,
    [cart_id, productname, quantity],
    function (err) {
      if (err) return res.status(500).send('Error adding item to cart');
      res.send({ id: this.lastID });
    });
});

// Approve cart and update inventory
app.post('/approve-cart', (req, res) => {
  const { cart_id } = req.body;
  if (!cart_id) return res.status(400).send('Missing cart ID');

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.all(`SELECT productname, quantity FROM cart_items WHERE cart_id = ?`, [cart_id], (err, items) => {
      if (err) return db.run('ROLLBACK', () => res.status(500).send('Error fetching cart items'));

      const processItem = (index) => {
        if (index >= items.length) {
          db.run(`UPDATE carts SET status = 'completed' WHERE id = ?`, [cart_id], function (err) {
            if (err) return db.run('ROLLBACK', () => res.status(500).send('Error updating cart status'));
            db.run('COMMIT');
            return res.send({ message: 'Cart approved and inventory updated' });
          });
          return;
        }

        const { productname, quantity } = items[index];

        db.get(`SELECT id FROM items WHERE productname = ?`, [productname], (err, item) => {
          if (err || !item) return db.run('ROLLBACK', () => res.status(500).send('Item not found'));
          const item_id = item.id;

          db.get(`SELECT quantity FROM inventory WHERE item_id = ?`, [item_id], (err, inv) => {
            if (err || !inv) return db.run('ROLLBACK', () => res.status(500).send('Inventory not found'));
            if (inv.quantity < quantity) {
              return db.run('ROLLBACK', () => res.status(400).send(`Not enough inventory for ${productname}`));
            }

            db.run(`UPDATE inventory SET quantity = quantity - ? WHERE item_id = ?`, [quantity, item_id], (err) => {
              if (err) return db.run('ROLLBACK', () => res.status(500).send('Error updating inventory'));
              processItem(index + 1);
            });
          });
        });
      };

      processItem(0);
    });
  });
});

// Delete expired carts and associated cart items
// After one hour
app.delete('/expired-carts', (req, res) => {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  db.serialize(() => {
    db.all(`SELECT id FROM carts WHERE status = 'pending' AND timestamp < ?`, [cutoff], (err, rows) => {
      if (err) return res.status(500).send('Error finding expired carts');

      const expiredCartIds = rows.map(row => row.id);
      if (expiredCartIds.length === 0) return res.send({ deleted: 0 });

      const placeholders = expiredCartIds.map(() => '?').join(',');

      db.run(`DELETE FROM cart_items WHERE cart_id IN (${placeholders})`, expiredCartIds, function (err) {
        if (err) return res.status(500).send('Error deleting cart items');

        db.run(`DELETE FROM carts WHERE id IN (${placeholders})`, expiredCartIds, function (err) {
          if (err) return res.status(500).send('Error deleting carts');
          res.send({ deleted: expiredCartIds.length });
        });
      });
    });
  });
});

// TEMP: Reset all data but keep tables NEED TO CHANGE TO app.DELETE USED GET FOR TESTING PURPOSE
app.get('/reset-db', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM inventory');
    db.run('DELETE FROM items');
    db.run('DELETE FROM categories');
    db.run('DELETE FROM vendors');
    db.run('DELETE FROM brands');
    res.send(' All data cleared. Tables preserved.');
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});


