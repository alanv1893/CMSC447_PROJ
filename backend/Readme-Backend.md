Back end Stuff

server.js - main entry point 
db.js - postgree connection 
routes/ - folder for the route files
controllers/ - folder for logic handlers 
models/ - folder for Database queries
.env - for database credentials 


# Notes:
- Needs link to the database (PostgreSQL), configured in `.env` and used in `db.js`
- Once connection is established, start writing queries in models and calling them via routes/controllers
- To link with Vue frontend, use Axios or Fetch to call the backend API endpoints (e.g., `/api/items`) from Vue components
