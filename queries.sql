
--Provides a list of all farmers markets
SELECT * MarketID,Name,Location FROM Market; 
 
--View details for a specific market including vendors
SELECT v.VendorID, v.Name
FROM Vendor v
JOIN Market_Vendor mv ON v.VendorID = mv.VendorID
WHERE mv.MarketID = 1;
 
--Search for products in the markets
SELECT p.Name AS Product, v.Name AS Vendor, vp.Price, vp.Quantity
FROM Product p
JOIN Vendor_Products vp ON p.ProductID = vp.ProductID
JOIN Vendor v ON vp.VendorID = v.VendorID
WHERE p.Name ILIKE '%Apples%';
 
--Place a pre-order for a product
INSERT INTO Preorder (OrderNumber, CustomerID, VendorID, MarketID, ProductID, OrderTime)
VALUES (1001, 1, 2, 1, 1, NOW());
 
--(This one will vary, different options to choose from)
--View all preorders for a customer
SELECT po.OrderNumber, p.Name AS Product, v.Name AS Vendor, m.Name AS Market, po.OrderTime
FROM Preorder po
JOIN Product p ON po.ProductID = p.ProductID
JOIN Vendor v ON po.VendorID = v.VendorID
JOIN Market m ON po.MarketID = m.MarketID
WHERE po.CustomerID = 1;
 
--List all products offered by a vendor
SELECT p.Name, vp.Price, vp.Quantity
FROM Vendor_Products vp
JOIN Product p ON vp.ProductID = p.ProductID
WHERE vp.VendorID = 2;
