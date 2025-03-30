// server.js

// Importing required packages
const express = require('express'); // Web framework for Node.js
const cors = require('cors'); // Allows frontend to talk to backend 
const dotenv = require('dotenv'); // .env file for sensitive data ( DB credentials)
const db = require('./db'); // This will be our database connection file

// Load variables from .env file into process.env
dotenv.config();

// Create an instance of express
const app = express();

// Set the port for the server to listen on (default to 3000 if not in .env)
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable CORS so frontend (Vue) can access backend
app.use(express.json()); // Parses incoming JSON requests (needed for POST/PUT)

// Basic test route; update later
app.get('/', (req, res) => {
  res.send('Backend is running'); // If you go to http://localhost:3000/, you’ll see this
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); // Confirm server is working
});
