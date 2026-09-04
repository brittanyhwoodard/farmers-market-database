create database theSCH;
use theSCH;

create table Market
(
	market_name varchar(50) NOT NULL,
	location varchar(50),
	market_id int NOT NULL AUTO_INCREMENT,
    primary key(market_id)
);

create table Vendor
(
	vendor_name varchar(50) NOT NULL,
	vendor_id int NOT NULL AUTO_INCREMENT,
    primary key(vendor_id)
);

create table Product
(
	product_name varchar(50),
	product_id int NOT NULL AUTO_INCREMENT,
    primary key(product_id)
);

create table Customer
(
	customer_email varchar(50),
	customer_name varchar(50),
	customer_id int NOT NULL AUTO_INCREMENT,
    primary key(customer_id)
);

create table Market_Vendors
(
	market_id int,
    vendor_id int,
    primary key(market_id, vendor_id),
    foreign key(market_id) references Market(market_id),
    foreign key(vendor_id) references Vendor(vendor_id)
);

create table Vendor_Products
(
	price decimal(10, 2),
	quantity int,
    vendor_id int,
    product_id int,
    primary key(vendor_id, product_id),
    foreign key(vendor_id) references Vendor(vendor_id),
    foreign key(product_id) references Product(product_id)
);

create table PreOrder
(
	order_number int,
	customer_id int,
	vendor_id int,
	market_id int,
    product_id int,
    order_time datetime,
    primary key(order_number),
    foreign key(customer_id) references Customer(customer_id),
    foreign key(vendor_id) references Vendor(vendor_id),
    foreign key(market_id) references Market(market_id),
    foreign key(product_id) references Product(product_id),
    foreign key(vendor_id, product_id) references Vendor_Products(vendor_id, product_id),
    foreign key(market_id, vendor_id) references Market_Vendors(market_id, vendor_id)
);

























