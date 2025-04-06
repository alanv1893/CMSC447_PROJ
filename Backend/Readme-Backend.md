╔══╗          ╔╗      ╔═══╗      ╔╗
║╔╗║          ║║      ║╔══╝      ║║
║╚╝╚╗╔══╗ ╔══╗║║╔╗    ║╚══╗╔═╗ ╔═╝║
║╔═╗║╚ ╗║ ║╔═╝║╚╝╝    ║╔══╝║╔╗╗║╔╗║
║╚═╝║║╚╝╚╗║╚═╗║╔╗╗    ║╚══╗║║║║║╚╝║
╚═══╝╚═══╝╚══╝╚╝╚╝    ╚═══╝╚╝╚╝╚══╝

SetUp:
*bash* npm install
Coroxy (Or something spelled like that helps connect it to vue)
I Think we need to also use AXIOS or something
**Update how they are setup once figured out please - chris 

List of all the Queries:
*Not an Exaustive List Will Make More 
GET /test - Test route to confirm server is working
GET /inventory - Get all inventory items
GET /vendors - Get all vendors
POST /vendors - Create a new vendor
GET /categories - Get all categories
POST /categories - Create a new category
GET /brands - Get all brands
POST /brands - Create a new brand
POST /items - Add new item and update inventory
GET /items/category/:category - Get all items by category name
POST /carts - Create a new cart
POST /cart-items - Add an item to a specific cart
POST /approve-cart - Approve cart and update inventory
DELETE /expired-carts - Delete expired carts and associated cart items
GET /reset-db - Reset all data but keep tables
GET /carts - Get all pending carts
GET /cart-items/:cart_id - Get all items in a cart
GET /export-inventory - Export items in inventory with associated names as an Excel (.xlsx) file
POST /upload-xlsx - Upload and parse an Excel (.xlsx) file for processing


Shopping Cart Explanation:
The problem with a single table is that carts are dynamic we dont know how many items they will get
To solve this i made 2 tables /carts and /cart-items 
When you make a cart it puts it in pending status and returns its ID
You can than add items indivdually to cart-items... each item needs the carts ID it belongs to
When a cart get approved the back end logic handles updating inv and changing stauts 

Inventory Explanation:
To try and keep things uniform and simple I made some tables that will hold the non unique values
i.e. vendor, category, brand. I also have a table for the item than a table for its inventory stock 
To keep it simple you only need to call post /items and you can include qty there for adding items 

Reports:

Daily Traffick:
The /traffic-report endpoint allows us to retrieve the traffic (i.e., approved transactions) broken down by hour for a specific day. This data is essential for generating a bar graph that shows which hours the store is most active.
Parameters:
	•	date: The date in the format YYYY-MM-DD for which you want to retrieve the report.
Example API Call:
GET /traffic-report?date=2025-01-10
Sample Response:
[
  { "hour": "09", "transactions": 5 },
  { "hour": "10", "transactions": 8 },
  { "hour": "11", "transactions": 4 },
  { "hour": "12", "transactions": 6 },
  { "hour": "13", "transactions": 3 },
  { "hour": "14", "transactions": 0 },
  { "hour": "15", "transactions": 2 },
  { "hour": "16", "transactions": 10 },
  { "hour": "17", "transactions": 9 },
  { "hour": "18", "transactions": 7 },
  { "hour": "19", "transactions": 3 },
  { "hour": "20", "transactions": 1 }
]

right now its set to only do the hoprus of 9am-8pm every call, may change later 





Export Inventory:

Added the xlsx package 
no query parameters needed
Example API Call:
GET /export-inventory

What It Returns:
	•	The API will return an Excel file (inventory_report.xlsx) containing the data from the inventory table along with the productname from the items table.
	•	The file will be downloaded automatically by your browser, and the data will be in a tabular format.

What It Returns:
	•	The API will return an Excel file (inventory_report.xlsx) containing the data from the inventory table along with the productname from the items table.
	•	The file will be downloaded automatically by your browser, and the data will be in a tabular format.
