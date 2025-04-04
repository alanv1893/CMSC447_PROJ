

Logic and database flow for frontend to backend cart creation

--User should have items and quantites stored they wanna buy first 
--Logic for Making the cart is intersting but will work 

first Call is create a cart for the user this is stored in the table 
'carts' it just has ID #, status, and will eventually have the user info 

The contents of the cart is stored in a seperate table
that table is cart_items 
It has a random primary key 
the cart identifier foreighn key 
the item 
the quantity 

to get a tranaction we must 
-return all the items in items_cart with its forieghn key 

**Remeber to update the transactione when processed and wipe the things from both tables
 
*Need logic for changing status from pending to approved or expired 
*******Need to add time stamp... done 

The logic of the inventory 

Tables exist to pre store set values that are shared
Table for catagories, vendor, manufaurer
*Done to keep things orgnized and not repeat values 

*Primary keys are just a number, we will use that to refrence the stored values 

List of all the Querriers that we need 
*List Catagories
*List Product in catagory 
*Write Transaction (Write tranaction in the table)
*Update Tranction Status 
*Transaction update inventory  
*Pull Sales Data 
*Pull traffick data
*Pull inventory data 
*Update Inventory from .xml 
*Add Item to Inventory 
*Remove Item from inventory 
*Update Stock of Items 


--Users
*User Permissions 
*Identifier


--Inventory 
*Catagory 
*Item
*Brand
*Cost 
*Quantity 
*Set Quantity re order flag??

--Tranactions 
*User
*Itenms?????????
*Approval status


//User Auth 
NEED To do 


