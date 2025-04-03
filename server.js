const express = require('express');
const app = express();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.sqlite');

app.use(express.json());

// Test route to confirm server is working
app.get('/test', (req, res) => {
  res.send('Server is working!');
});

// Add new inventory item
app.post('/inventory', (req, res) => {
  const { product, supplier, category, cost, quantity } = req.body;
  db.run(
    'INSERT INTO inventory (product, supplier, category, cost, quantity) VALUES (?, ?, ?, ?, ?)',
    [product, supplier, category, cost, quantity],
    function (err) {
      if (err) return res.status(500).send('DB Error');
      res.send({ product });
    }
  );
});

// Get all inventory items
app.get('/inventory', (req, res) => {
  db.all('SELECT * FROM inventory', (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.send(rows);
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});