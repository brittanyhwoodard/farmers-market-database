<h1>Normalization of our schema</h1>

<h3>Our Table information:</h3>
<p>Customer:  Customer ID, Name, Email</p>
<p>Preorder:  Order number, Customer_ID, Vendor_ID, Market_ID, Product_ID, Order-time // Vendor: Name, Vendor_ID</p>
<p>Market-vendor:  Market ID, Vendor ID</p>
<p>Market:  Name, Location, Market ID</p>
<p>Vendor Products:  Vendor_ID, Product_ID, Price, Quantity</p>
<p>Product:  Product _ID, name</p>
<br>

<br><br>
<img src="Frigure1.jpg" alt="Normalization Chart">

<h4>Relationships</h4>
<p>Customer places Preorder</p>
<p>Vendor receives Preorder</p>
<p>Market includes Market-Vendor</p>
<p>Vendor operates Market-Vendor</p>
<p>Vendor offers Vendor Products</p>
<p>Product includes Vendor Products</p>
<p>Market serves Preorder</p>
<p>Product contains Preorder</p>

<br>

<h3>With Normalization Done in LUCID CHART:</h3>

<br><br>
<img src="Figure2.png" alt="Normalization Chart 2">

<h4>Entities and Attributes</h4>


<h6>Customer</h6>
<p>CustomerID (Primary Key), Name, Email</p>
<h6>Preorder</h6>
<p>OrderNumber (Primary Key), CustomerID (Foreign Key), VendorID (Foreign Key), MarketID (Foreign Key), ProductID (Foreign Key), OrderTime</p>
<h6>Vendor</h6>
<p>VendorID (Primary Key), Name</p>
<h6>Market-Vendor</h6>
<p>MarketID (Primary Key), VendorID (Primary Key)</p>
<h6>Market</h6>
<p>MarketID (Primary Key), Name, Location</p>
<h6>Vendor Products</h6>
<p>VendorID (Primary Key), ProductID (Primary Key), Price, Quantity</p>
<h6>Product</h6>
<p>ProductID (Primary Key), Name</p>

<br>

<h4>Relationships</h4>
<p>Customer places Preorder</p>
<p>Preorder receives Vendor</p>
<p>Preorder serves Market</p>
<p>Preorder contains Product</p>
<p>Vendor operates Market-Vendor</p>
<p>Market includes Market-Vendor</p>
<p>Vendor offers Vendor Products</p>
<p>Product includes Vendor Products</p>

<br>

<h4>Cardinalities</h4>
<p>Customer to Preorder: 1:M</p>
<p>Preorder to Vendor:  M:1.</p>
<p>Preorder to Market: Each preorder serves one market, but a market can serve many preorders M:1</p>
<p>Preorder to Product: M:M.</p>
<p>Vendor to Market-Vendor: M:M</p>
<p>Vendor to Vendor Products: M:M</p>
<p>Market to Market-Vendor: M:M</p>



