const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('./auth');

// Rename functions
function renameItemName(oldName, newName) {
  db.run(`UPDATE items SET productname = ? WHERE productname = ?`, [newName, oldName]);
}

function renameVendor(oldName, newName) {
  db.run(`UPDATE vendors SET vendor = ? WHERE vendor = ?`, [newName, oldName]);
}

function renameCategory(oldName, newName) {
  db.run(`UPDATE categories SET category = ? WHERE category = ?`, [newName, oldName]);
}

function renameBrand(oldName, newName) {
  db.run(`UPDATE brands SET brand_name = ? WHERE brand_name = ?`, [newName, oldName]);
}

// Merge functions
function mergeCategories(oldCategory, newCategory) {
  db.get(`SELECT id FROM categories WHERE category = ?`, [newCategory], (err, row) => {
    if (!row) return;
    const newId = row.id;
    db.run(`UPDATE items SET category_id = ? WHERE category_id = (SELECT id FROM categories WHERE category = ?)`, [newId, oldCategory]);
    db.run(`DELETE FROM categories WHERE category = ?`, [oldCategory]);
  });
}

function mergeVendors(oldVendor, newVendor) {
  db.get(`SELECT id FROM vendors WHERE vendor = ?`, [newVendor], (err, row) => {
    if (!row) return;
    const newId = row.id;
    db.run(`UPDATE items SET vendor_id = ? WHERE vendor_id = (SELECT id FROM vendors WHERE vendor = ?)`, [newId, oldVendor]);
    db.run(`DELETE FROM vendors WHERE vendor = ?`, [oldVendor]);
  });
}

function mergeBrands(oldBrand, newBrand) {
  db.get(`SELECT id FROM brands WHERE brand_name = ?`, [newBrand], (err, row) => {
    if (!row) return;
    const newId = row.id;
    db.run(`UPDATE items SET brand_id = ? WHERE brand_id = (SELECT id FROM brands WHERE brand_name = ?)`, [newId, oldBrand]);
    db.run(`DELETE FROM brands WHERE brand_name = ?`, [oldBrand]);
  });
}

function mergeDuplicateItems(itemA, itemB) {
  db.run(`UPDATE inventory SET item_id = (SELECT id FROM items WHERE productname = ?) WHERE item_id = (SELECT id FROM items WHERE productname = ?)`, [itemA, itemB]);
  db.run(`DELETE FROM items WHERE productname = ?`, [itemB]);
}

// Deletion functions
function deleteUnusedItem(itemName) {
  db.run(`DELETE FROM items WHERE productname = ?`, [itemName]);
}

function deleteUnusedReference(type, name) {
  const tableMap = {
    vendor: 'vendors',
    category: 'categories',
    brand: 'brands'
  };
  const fieldMap = {
    vendor: 'vendor_id',
    category: 'category_id',
    brand: 'brand_id'
  };
  const nameFieldMap = {
    vendor: 'vendor',
    category: 'category',
    brand: 'brand_name'
  };

  const table = tableMap[type];
  const field = fieldMap[type];
  const nameField = nameFieldMap[type];

  db.get(`SELECT id FROM ${table} WHERE ${nameField} = ?`, [name], (err, row) => {
    if (!row) return;
    const id = row.id;
    db.get(`SELECT COUNT(*) as count FROM items WHERE ${field} = ?`, [id], (err, result) => {
      if (result.count === 0) {
        db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
      }
    });
  });
}

// Update functions
function updateItemCost(itemName, newCost) {
  db.run(`UPDATE items SET cost = ? WHERE productname = ?`, [newCost, itemName]);
}

function updateInventoryQuantity(itemName, newQty) {
  db.get(`SELECT id FROM items WHERE productname = ?`, [itemName], (err, row) => {
    if (row) {
      db.run(`UPDATE inventory SET quantity = ? WHERE item_id = ?`, [newQty, row.id]);
    }
  });
}

function removeItemAndInventory(itemName) {
  db.get(`SELECT id FROM items WHERE productname = ?`, [itemName], (err, row) => {
    if (row) {
      db.run(`DELETE FROM inventory WHERE item_id = ?`, [row.id]);
      db.run(`DELETE FROM items WHERE id = ?`, [row.id]);
    }
  });
}

function reassignItemDetails(itemName, vendorName, categoryName, brandName) {
  db.get(`SELECT id FROM items WHERE productname = ?`, [itemName], (err, itemRow) => {
    if (!itemRow) return;
    db.get(`SELECT id FROM vendors WHERE vendor = ?`, [vendorName], (err, vRow) => {
      db.get(`SELECT id FROM categories WHERE category = ?`, [categoryName], (err, cRow) => {
        db.get(`SELECT id FROM brands WHERE brand_name = ?`, [brandName], (err, bRow) => {
          db.run(`UPDATE items SET vendor_id = ?, category_id = ?, brand_id = ? WHERE id = ?`,
            [vRow?.id, cRow?.id, bRow?.id, itemRow.id]);
        });
      });
    });
  });
}

function flagZeroOrNegativeStock(callback) {
  db.all(`SELECT items.productname, inventory.quantity 
          FROM inventory 
          JOIN items ON items.id = inventory.item_id 
          WHERE quantity <= 0`, (err, rows) => {
    callback(rows);
  });
}

// --- Normalization API Endpoints ---

router.post('/normalize/rename-item', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldName, newName } = req.body;
  renameItemName(oldName, newName);
  res.send('Item renamed');
});

router.post('/normalize/rename-vendor', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldName, newName } = req.body;
  renameVendor(oldName, newName);
  res.send('Vendor renamed');
});

router.post('/normalize/rename-category', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldName, newName } = req.body;
  renameCategory(oldName, newName);
  res.send('Category renamed');
});

router.post('/normalize/rename-brand', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldName, newName } = req.body;
  renameBrand(oldName, newName);
  res.send('Brand renamed');
});

router.post('/normalize/merge-categories', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldCategory, newCategory } = req.body;
  mergeCategories(oldCategory, newCategory);
  res.send('Categories merged');
});

router.post('/normalize/merge-vendors', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldVendor, newVendor } = req.body;
  mergeVendors(oldVendor, newVendor);
  res.send('Vendors merged');
});

router.post('/normalize/merge-brands', verifyToken, requireRole(['admin']), (req, res) => {
  const { oldBrand, newBrand } = req.body;
  mergeBrands(oldBrand, newBrand);
  res.send('Brands merged');
});

router.post('/normalize/merge-duplicate-items', verifyToken, requireRole(['admin']), (req, res) => {
  const { keepItem, removeItem } = req.body;
  mergeDuplicateItems(keepItem, removeItem);
  res.send('Duplicate items merged');
});

router.post('/normalize/delete-unused-item', verifyToken, requireRole(['admin']), (req, res) => {
  const { itemName } = req.body;
  deleteUnusedItem(itemName);
  res.send('Unused item deleted');
});

router.post('/normalize/delete-unused-reference', verifyToken, requireRole(['admin']), (req, res) => {
  const { type, name } = req.body;
  deleteUnusedReference(type, name);
  res.send('Unused reference deleted');
});

router.post('/normalize/update-item-cost', verifyToken, requireRole(['admin']), (req, res) => {
  const { itemName, newCost } = req.body;
  updateItemCost(itemName, newCost);
  res.send('Item cost updated');
});

router.post('/normalize/update-inventory-quantity', verifyToken, requireRole(['admin']), (req, res) => {
  const { itemName, newQty } = req.body;
  updateInventoryQuantity(itemName, newQty);
  res.send('Inventory quantity updated');
});

router.post('/normalize/remove-item-and-inventory', verifyToken, requireRole(['admin']), (req, res) => {
  const { itemName } = req.body;
  removeItemAndInventory(itemName);
  res.send('Item and inventory removed');
});

router.post('/normalize/reassign-item-details', verifyToken, requireRole(['admin']), (req, res) => {
  const { itemName, vendorName, categoryName, brandName } = req.body;
  reassignItemDetails(itemName, vendorName, categoryName, brandName);
  res.send('Item details reassigned');
});

router.get('/normalize/flag-low-stock', verifyToken, requireRole(['admin']), (req, res) => {
  flagZeroOrNegativeStock((rows) => {
    res.json(rows);
  });
});

const app = express();
app.use(express.json());
app.use('/', router);

app.listen(3001, () => {
  console.log('Normalize service running on port 3001');
});
