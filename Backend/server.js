const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx'); // Import the xlsx package
const db = new sqlite3.Database('./db/database.sqlite');
const cors = require('cors')
const bcrypt = require('bcrypt'); 

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


// Reutrns all inventory values
app.get('/full-inventory', (req, res) => {
  const sql = `
    SELECT 
      items.productname,
      items.cost,
      categories.category,
      vendors.vendor,
      brands.brand_name,
      inventory.quantity
    FROM items
    JOIN categories ON items.category_id = categories.id
    JOIN vendors ON items.vendor_id = vendors.id
    JOIN brands ON items.brand_id = brands.id
    JOIN inventory ON inventory.item_id = items.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).send('Database error: ' + err.message);
    res.json(rows);
  });
});

// TEMP: Reset all data but keep tables NEED TO CHANGE TO app.DELETE USED GET FOR TESTING PURPOSE
app.get('/reset-db', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM cart_items');
    db.run('DELETE FROM carts');
    db.run('DELETE FROM inventory');
    db.run('DELETE FROM items');
    db.run('DELETE FROM categories');
    db.run('DELETE FROM vendors');
    db.run('DELETE FROM brands');
    db.run('DELETE FROM sqlite_sequence'); // resets autoincrement IDs
    res.send('✅ All reset');
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

///////////////////////////////////////////////////////////////////////////
//IMPLEMENTATION OF THE LOGIN SERVICES
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  // Check if username is UMBC email
  if (!username.endsWith('@umbc.edu')) {
    return res.status(400).send('Only UMBC email addresses are allowed');
  }

  // Query database for user
  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal server error');
    }

    // Check if user exists
    if (!user) {
      return res.status(400).send('User not found');
    }

    // Compare entered password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send('Invalid password');
    }

    // Successful login
    res.send({ message: 'Login successful', userId: user.id });
  });
});

///////////////////////////////////////////////////////////////////////////////

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

// Get all pending carts
app.get('/carts', (req, res) => {
  db.all(`SELECT * FROM carts WHERE status = 'pending' ORDER BY id DESC`, (err, rows) => {
    if (err) return res.status(500).send('Error fetching carts');
    res.send(rows);
  });
});

// Get all items in a cart
app.get('/cart-items/:cart_id', (req, res) => {
  const { cart_id } = req.params;

  const sql = `
    SELECT ci.productname, ci.quantity
    FROM cart_items ci
    WHERE ci.cart_id = ?
  `;

  db.all(sql, [cart_id], (err, rows) => {
    if (err) {
      console.error('Failed to fetch cart items:', err);
      return res.status(500).send('Error fetching cart items');
    }
    res.send(rows);
  });
});

// Get transaction count by hour for a given day
app.get('/traffic-report', (req, res) => {
  const { date } = req.query; // The specific date (e.g., '2025-01-10')

  // Validate date format
  if (!date) {
    return res.status(400).send('Date is required in the format YYYY-MM-DD');
  }

  // SQL query to get the number of approved transactions per hour for the given day
  const sql = `
    SELECT 
      strftime('%H', timestamp) AS hour, 
      COUNT(*) AS transactions
    FROM carts
    WHERE status = 'completed' 
      AND DATE(timestamp) = ?
    GROUP BY hour
    ORDER BY hour;
  `;

  db.all(sql, [date], (err, rows) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).send('Error fetching traffic report');
    }

    // If no data found for the day
    if (rows.length === 0) {
      return res.status(404).send('No transactions found for the specified day');
    }

    // Prepare the data to return in a format suitable for a bar graph
    const trafficData = [];

    // Fill in all hours from 9 AM to 8 PM (default open hours)
    for (let hour = 9; hour <= 20; hour++) {
      const hourString = hour < 10 ? `0${hour}` : `${hour}`;
      const entry = rows.find(row => row.hour === hourString);
      trafficData.push({
        hour: hourString,
        transactions: entry ? entry.transactions : 0,
      });
    }

    res.send(trafficData);
  });
});


// Export items from inventory with associated item names as an .xlsx file
app.get('/export-inventory', (req, res) => {
  const sql = `
    SELECT i.productname, iv.quantity
    FROM inventory iv
    JOIN items i ON iv.item_id = i.id
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).send('Error fetching inventory data');
    }

    // Check if there is data to export
    if (rows.length === 0) {
      return res.status(404).send('No inventory data found');
    }

    // Create a new workbook
    const wb = xlsx.utils.book_new();

    // Create a worksheet from the inventory data
    const ws = xlsx.utils.json_to_sheet(rows);

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Inventory');

    // Write the workbook to a buffer
    const buffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Set response headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
