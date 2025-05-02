const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx'); // Import the xlsx package
const db = new sqlite3.Database('./db/database.sqlite');
const cors = require('cors')
const bcrypt = require('bcrypt'); 


app.use(express.json());
app.use(cors());
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

app.get('/check-inventory/:cartId', (req, res) => {
  const { cartId } = req.params;

  const sql = `
    SELECT ci.productname, ci.quantity AS requested, iv.quantity AS available
    FROM cart_items ci
    JOIN items i ON ci.productname = i.productname
    JOIN inventory iv ON i.id = iv.item_id
    WHERE ci.cart_id = ?
  `;

  db.all(sql, [cartId], (err, rows) => {
    if (err) return res.status(500).send('Error checking inventory');

    const insufficient = rows.filter(row => row.available < row.requested);

    if (insufficient.length > 0) {
      const list = insufficient.map(i => `${i.productname} (Need ${i.requested}, Have ${i.available})`);
      return res.status(200).json({
        status: 'insufficient',
        message: `Insufficient quantity for: ${list.join(', ')}`
      });
    }

    res.json({ status: 'sufficient' });
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
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check if username is UMBC email
  if (!username.endsWith('@umbc.edu')) {
    return res.status(400).json({ error: 'Only UMBC email addresses are allowed' });
  }

  // Query database for user
  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username' });
    }

    // Compare entered password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Successful login
    res.json({
      message: 'Login successful',
      userId: user.id,
      username: user.username,
      role: user.role
    });
  });
});

////////////////////////////////////////////////////////////////////////

// Create a new cart
app.post('/carts', (req, res) => {
  const now = new Date();
  const nyTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  const [date, time] = nyTime.split(', ');
  const [month, day, year] = date.split('/');
  const formatted = `${year}-${month}-${day} ${time}`;

  db.run(`INSERT INTO carts (status, timestamp) VALUES ('pending', ?)`,
    [formatted],
    function (err) {
      if (err) {
        console.error('Error inserting cart:', err);
        return res.status(500).send('Error creating cart');
      }
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
  const { cart_id, override, override_password, override_username } = req.body;

  if (!cart_id) return res.status(400).send('Missing cart ID');
  if (override && (!override_password || !override_username)) {
    return res.status(400).send('Missing override credentials');
  }

  function proceedWithApproval(approverUsername) {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.all(`SELECT productname, quantity FROM cart_items WHERE cart_id = ?`, [cart_id], (err, items) => {
        if (err) return db.run('ROLLBACK', () => res.status(500).send('Error fetching cart items'));

        const processItem = (index) => {
          if (index >= items.length) {
            db.run(`UPDATE carts SET status = 'completed', approved_by = ? WHERE id = ?`,
              [approverUsername, cart_id], (err) => {
              if (err) return db.run('ROLLBACK', () => res.status(500).send('Error updating cart'));
              db.run('COMMIT');
              return res.send({ message: 'Cart approved successfully' });
            });
            return;
          }

          const { productname, quantity } = items[index];

          db.get(`SELECT id FROM items WHERE productname = ?`, [productname], (err, item) => {
            if (err || !item) return db.run('ROLLBACK', () => res.status(500).send('Item not found'));
            const item_id = item.id;
            
            db.get(`SELECT quantity FROM inventory WHERE item_id = ?`, [item_id], (err, inv) => {
              if (err || !inv) return db.run('ROLLBACK', () => res.status(500).send('Inventory not found'));
            
              const newQuantity = Math.max(inv.quantity - quantity, 0);
            
              db.run(`UPDATE inventory SET quantity = ? WHERE item_id = ?`, [newQuantity, item_id], (err) => {
                if (err) return db.run('ROLLBACK', () => res.status(500).send('Error updating inventory'));
                processItem(index + 1);
              });
            });
          });
        };

        processItem(0);
      });
    });
  }

  // 🔐 Override path
  if (override) {
    db.get(`SELECT password FROM override_passwords WHERE username = ?`, [override_username], async (err, row) => {
      if (err || !row) return res.status(404).send('Override user not found');

      const isValid = await bcrypt.compare(override_password, row.password);
      if (!isValid) return res.status(403).send('Invalid override password');

      proceedWithApproval(override_username);
    });

  // ✅ Normal path
  } else {
    db.all(`SELECT ci.productname, ci.quantity AS requested, iv.quantity AS available
            FROM cart_items ci
            JOIN items i ON ci.productname = i.productname
            JOIN inventory iv ON i.id = iv.item_id
            WHERE ci.cart_id = ?`, [cart_id], (err, rows) => {
      if (err) return res.status(500).send('Error checking inventory');

      const insufficient = rows.filter(row => row.available < row.requested);
      if (insufficient.length > 0) {
        return res.status(400).send('Insufficient inventory');
      }

      proceedWithApproval('system'); // fallback approver name
    });
  }
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
    SELECT 
      i.productname AS name, 
      c.category AS category, 
      v.vendor AS supplier, 
      b.brand_name AS brand, 
      i.cost, 
      iv.quantity
    FROM inventory iv
    JOIN items i ON iv.item_id = i.id
    JOIN categories c ON i.category_id = c.id
    JOIN vendors v ON i.vendor_id = v.id
    JOIN brands b ON i.brand_id = b.id
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

/*
NORMALIZE stuff


*/
//app.use(bodyParser.json());

// Rename an item
app.post('/normalize/rename-item', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).send('Missing names');
  db.run(
    `UPDATE items SET productname = ? WHERE productname = ?`,
    [newName, oldName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Rename a vendor
app.post('/normalize/rename-vendor', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).send('Missing names');
  db.run(
    `UPDATE vendors SET vendor = ? WHERE vendor = ?`,
    [newName, oldName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Rename a category
app.post('/normalize/rename-category', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).send('Missing names');
  db.run(
    `UPDATE categories SET category = ? WHERE category = ?`,
    [newName, oldName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Rename a brand
app.post('/normalize/rename-brand', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).send('Missing names');
  db.run(
    `UPDATE brands SET brand_name = ? WHERE brand_name = ?`,
    [newName, oldName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Merge two categories
app.post('/normalize/merge-categories', (req, res) => {
  const { oldCategory, newCategory } = req.body;
  if (!oldCategory || !newCategory) return res.status(400).send('Missing categories');
  db.serialize(() => {
    db.run(
      `UPDATE items
         SET category_id = (SELECT id FROM categories WHERE category = ?)
       WHERE category_id = (SELECT id FROM categories WHERE category = ?)`,
      [newCategory, oldCategory]
    );
    db.run(
      `DELETE FROM categories WHERE category = ?`,
      [oldCategory],
      function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ deleted: this.changes });
      }
    );
  });
});

// Merge two vendors
app.post('/normalize/merge-vendors', (req, res) => {
  const { oldVendor, newVendor } = req.body;
  if (!oldVendor || !newVendor) return res.status(400).send('Missing vendors');
  db.serialize(() => {
    db.run(
      `UPDATE items
         SET vendor_id = (SELECT id FROM vendors WHERE vendor = ?)
       WHERE vendor_id = (SELECT id FROM vendors WHERE vendor = ?)`,
      [newVendor, oldVendor]
    );
    db.run(
      `DELETE FROM vendors WHERE vendor = ?`,
      [oldVendor],
      function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ deleted: this.changes });
      }
    );
  });
});

// Merge two brands
app.post('/normalize/merge-brands', (req, res) => {
  const { oldBrand, newBrand } = req.body;
  if (!oldBrand || !newBrand) return res.status(400).send('Missing brands');
  db.serialize(() => {
    db.run(
      `UPDATE items
         SET brand_id = (SELECT id FROM brands WHERE brand_name = ?)
       WHERE brand_id = (SELECT id FROM brands WHERE brand_name = ?)`,
      [newBrand, oldBrand]
    );
    db.run(
      `DELETE FROM brands WHERE brand_name = ?`,
      [oldBrand],
      function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ deleted: this.changes });
      }
    );
  });
});

// Merge duplicate items
app.post('/normalize/merge-duplicate-items', (req, res) => {
  const { keepItem, removeItem } = req.body;
  if (!keepItem || !removeItem) return res.status(400).send('Missing items');
  db.serialize(() => {
    // Transfer inventory quantity
    db.run(
      `UPDATE inventory
         SET quantity = quantity + (
           SELECT quantity
             FROM inventory iv
             JOIN items i ON iv.item_id = i.id
            WHERE i.productname = ?
         )
       WHERE item_id = (SELECT id FROM items WHERE productname = ?)`,
      [removeItem, keepItem]
    );
    // Delete the removed item's inventory row
    db.run(
      `DELETE FROM inventory
         WHERE item_id = (SELECT id FROM items WHERE productname = ?)`,
      [removeItem]
    );
    // Delete the duplicate item record
    db.run(
      `DELETE FROM items WHERE productname = ?`,
      [removeItem],
      function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ deleted: this.changes });
      }
    );
  });
});

// Delete unused item (has no inventory)
app.post('/normalize/delete-unused-item', (req, res) => {
  const { itemName } = req.body;
  if (!itemName) return res.status(400).send('Missing item name');
  db.run(
    `DELETE FROM items
       WHERE productname = ?
         AND NOT EXISTS (
           SELECT 1 FROM inventory WHERE item_id = items.id
         )`,
    [itemName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ deleted: this.changes });
    }
  );
});

// Delete unused reference (category, vendor or brand)
app.post('/normalize/delete-unused-reference', (req, res) => {
  const { type, name } = req.body;
  if (!type || !name) return res.status(400).send('Missing type/name');
  let table, column;
  if (type === 'category') {
    table = 'categories'; column = 'category';
  } else if (type === 'vendor') {
    table = 'vendors'; column = 'vendor';
  } else if (type === 'brand') {
    table = 'brands'; column = 'brand_name';
  } else {
    return res.status(400).send('Invalid type');
  }
  db.run(
    `DELETE FROM ${table}
       WHERE ${column} = ?
         AND NOT EXISTS (
           SELECT 1 FROM items WHERE ${table.slice(0,-1)}_id = (SELECT id FROM ${table} WHERE ${column} = ?)
         )`,
    [name, name],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ deleted: this.changes });
    }
  );
});

// Update item cost
app.post('/normalize/update-item-cost', (req, res) => {
  const { itemName, newCost } = req.body;
  if (!itemName || newCost == null) return res.status(400).send('Missing fields');
  db.run(
    `UPDATE items SET cost = ? WHERE productname = ?`,
    [newCost, itemName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Update inventory quantity
app.post('/normalize/update-inventory-quantity', (req, res) => {
  const { itemName, newQty } = req.body;
  if (!itemName || newQty == null) return res.status(400).send('Missing fields');
  db.run(
    `UPDATE inventory
       SET quantity = ?
       WHERE item_id = (SELECT id FROM items WHERE productname = ?)`,
    [newQty, itemName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Remove item and its inventory
app.post('/normalize/remove-item-and-inventory', (req, res) => {
  const { itemName } = req.body;
  if (!itemName) return res.status(400).send('Missing item name');
  db.serialize(() => {
    db.run(
      `DELETE FROM inventory WHERE item_id = (SELECT id FROM items WHERE productname = ?)`,
      [itemName]
    );
    db.run(
      `DELETE FROM items WHERE productname = ?`,
      [itemName],
      function(err) {
        if (err) return res.status(500).send(err.message);
        res.json({ deleted: this.changes });
      }
    );
  });
});

// Reassign item details (vendor, category, brand)
app.post('/normalize/reassign-item-details', (req, res) => {
  const { itemName, vendorName, categoryName, brandName } = req.body;
  if (!itemName || !vendorName || !categoryName || !brandName) return res.status(400).send('Missing fields');
  db.run(
    `UPDATE items
       SET vendor_id = (SELECT id FROM vendors WHERE vendor = ?),
           category_id = (SELECT id FROM categories WHERE category = ?),
           brand_id = (SELECT id FROM brands WHERE brand_name = ?)
       WHERE productname = ?`,
    [vendorName, categoryName, brandName, itemName],
    function(err) {
      if (err) return res.status(500).send(err.message);
      res.json({ changed: this.changes });
    }
  );
});

// Flag low‑stock items
app.get('/normalize/flag-low-stock', (req, res) => {
  db.all(
    `SELECT i.productname, iv.quantity
       FROM inventory iv
       JOIN items i ON iv.item_id = i.id
      WHERE iv.quantity <= 0`,
    [],
    (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.json(rows);
    }
  );
});

//const normalizeRouter = require('./normalize');
//app.use('/normalize', normalizeRouter);

// Analytics: popular items by category
app.get('/analytics/popular-items/:category', (req, res) => {
  const category = req.params.category;
  const limit = parseInt(req.query.limit) || 10;
  const sql = `
    SELECT i.productname, SUM(ci.quantity) AS total_ordered
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    JOIN items i ON ci.productname = i.productname
    JOIN categories cat ON i.category_id = cat.id
    WHERE cat.category = ?
      AND c.status = 'completed'
    GROUP BY i.productname
    ORDER BY total_ordered DESC
    LIMIT ?
  `;
  db.all(sql, [category, limit], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Analytics: vendor order frequency
app.get('/analytics/vendor-frequency', (req, res) => {
  const { vendor, start_date, end_date } = req.query;
  if (!vendor || !start_date || !end_date) {
    return res.status(400).send('vendor, start_date, and end_date query params required');
  }
  const sql = `
    SELECT COUNT(DISTINCT c.id) AS num_orders, SUM(ci.quantity) AS total_units
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    JOIN items i ON ci.productname = i.productname
    JOIN vendors v ON i.vendor_id = v.id
    WHERE v.vendor = ?
      AND c.status = 'completed'
      AND date(c.timestamp) BETWEEN date(?) AND date(?)
  `;
  db.get(sql, [vendor, start_date, end_date], (err, row) => {
    if (err) return res.status(500).send(err.message);
    res.json(row);
  });
});

// Analytics: daily cart counts
app.get('/analytics/daily-carts', (req, res) => {
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).send('start_date and end_date query params required');
  }
  const sql = `
    SELECT date(timestamp) AS day, COUNT(*) AS cart_count
    FROM carts
    WHERE date(timestamp) BETWEEN date(?) AND date(?)
    GROUP BY day
    ORDER BY day
  `;
  db.all(sql, [start_date, end_date], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

// Analytics: brand demand over time
app.get('/analytics/brand-demand', (req, res) => {
  const { brand, interval } = req.query;
  const bucket = interval === 'month' ? "strftime('%Y-%m', c.timestamp)" :
                 interval === 'day'   ? "date(c.timestamp)" :
                 "strftime('%Y-%W', c.timestamp)";
  if (!brand) {
    return res.status(400).send('brand query param required');
  }
  const sql = `
    SELECT ${bucket} AS period, SUM(ci.quantity) AS total_units
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.id
    JOIN items i ON ci.productname = i.productname
    JOIN brands b ON i.brand_id = b.id
    WHERE b.brand_name = ?
      AND c.status = 'completed'
    GROUP BY period
    ORDER BY period
  `;
  db.all(sql, [brand], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/normalize/update-full-item', (req, res) => {
  const { oldName, productname, cost, category, vendor, brand, quantity } = req.body;
  if (!oldName || !productname || !category || !vendor || !brand || cost == null || quantity == null) {
    return res.status(400).send('Missing fields');
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const getOrInsert = (table, column, value, cb) => {
      db.get(`SELECT id FROM ${table} WHERE ${column} = ?`, [value], (err, row) => {
        if (err) return cb(err);
        if (row) return cb(null, row.id);
        db.run(`INSERT INTO ${table} (${column}) VALUES (?)`, [value], function(err) {
          if (err) return cb(err);
          cb(null, this.lastID);
        });
      });
    };

    getOrInsert('categories', 'category', category, (err, category_id) => {
      if (err) return db.run('ROLLBACK', () => res.status(500).send('Category error'));

      getOrInsert('vendors', 'vendor', vendor, (err, vendor_id) => {
        if (err) return db.run('ROLLBACK', () => res.status(500).send('Vendor error'));

        getOrInsert('brands', 'brand_name', brand, (err, brand_id) => {
          if (err) return db.run('ROLLBACK', () => res.status(500).send('Brand error'));

          db.get(`SELECT id FROM items WHERE productname = ?`, [oldName], (err, itemRow) => {
            if (err || !itemRow) return db.run('ROLLBACK', () => res.status(404).send('Item not found'));

            const item_id = itemRow.id;
            db.run(
              `UPDATE items SET productname = ?, cost = ?, category_id = ?, vendor_id = ?, brand_id = ? WHERE id = ?`,
              [productname, cost, category_id, vendor_id, brand_id, item_id],
              (err) => {
                if (err) return db.run('ROLLBACK', () => res.status(500).send('Item update failed'));

                db.run(`UPDATE inventory SET quantity = ? WHERE item_id = ?`, [quantity, item_id], (err) => {
                  if (err) return db.run('ROLLBACK', () => res.status(500).send('Inventory update failed'));
                  db.run('COMMIT');
                  res.send({ message: 'Item updated successfully' });
                });
              }
            );
          });
        });
      });
    });
  });
});



// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
