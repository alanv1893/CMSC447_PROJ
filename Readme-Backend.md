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




