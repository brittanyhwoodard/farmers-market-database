const API_BASE_URL = 'http://localhost:3000'; //Make sure port matches terminal message ex.) "The SCH API is running on http://localhost:3000"
const API_MARKETS_ENDPOINT = '/api/markets';

let currentMarketDetails = null; // stores market data locally
// Function to load cart data from localStorage on page load
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('shoppingCart');
    // If storedCart exists, parse it from JSON; otherwise, return an empty array
    return storedCart ? JSON.parse(storedCart) : [];
}

// Function to save cart data to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('shoppingCart', JSON.stringify(shoppingCart));
}

let shoppingCart = loadCartFromLocalStorage(); // Load cart data

// detail overlay functionality
document.addEventListener('DOMContentLoaded', () => {
    const detailOverlay = document.getElementById('details_overlay');
    const closeDetailBtn = document.getElementById('close_details');

    // Function to hide detail overlay
    function hideOverlay() {
        detailOverlay.style.display = 'none';
    
        // Clear content when closing
        const marketDetailName = document.getElementById('marketName'); 
        const marketDetailAddress = document.getElementById('marketAddress'); 
        const vendorsListContainer = document.getElementById('vendorsList'); 
        const productsListContainer = document.getElementById('productsList'); 

        marketDetailName.textContent = 'Loading...';
        marketDetailAddress.textContent = '';
        vendorsListContainer.innerHTML = '<h4>Vendors:</h4><ul></ul>';
        productsListContainer.innerHTML = '<h4>Products:</h4><ul></ul>';

        // resets stored data
        currentMarketDetails = null;
    }

    // Attach listener close button
    closeDetailBtn.addEventListener('click', hideOverlay);

});

// checkout overlay functionality
document.addEventListener('DOMContentLoaded', () => {
    const checkoutOverlay = document.getElementById('checkout_overlay');
    const closeCartBtn = document.getElementById('close_checkout');
    const cartIcon = document.getElementById('cart_icon');
    const cartCount = document.getElementById('cart_count');
    const checkoutForm = document.getElementById('checkoutForm');

    // Attach event listener to cart icon
    cartIcon.addEventListener('click', showCartOverlay);
    // Also attach event listener to cart count
    cartCount.addEventListener('click', showCartOverlay);

    // Function to show cart overlay
    function showCartOverlay() {
        checkoutOverlay.style.display = 'block';
        renderCart();
    }

    // Function to hide cart overlay
    function hideCartOverlay() {
        checkoutOverlay.style.display = 'none';
    }   

    // Attach listener close button
    closeCartBtn.addEventListener('click', hideCartOverlay);

    const marketDirectoryList = document.getElementsByClassName('marketList');
    if (marketDirectoryList) {
        fetchMarketDirectory();
    }

    // Initialize the cart count on load
    updateCartCount(); 

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Stop the form from actually submitting (reloading the page)
            
            // Basic validation check
            if (shoppingCart.length === 0) {
                alert("Your cart is empty. Please add items before placing an order.");
                return;
            }

            // Success Message
            alert('Order Placed Successfully! We will contact you soon.');

            // Clear the cart data and re-render the empty cart
            shoppingCart = [];
            saveCartToLocalStorage();
            renderCart();
            updateCartCount();

            // close the checkout overlay after successful order
            const checkoutOverlay = document.getElementById('checkout_overlay');
            if (checkoutOverlay) {
                checkoutOverlay.style.display = 'none';
            }
        });
    }

});


// search function
function searchResults(event) {
    event.preventDefault();

    var searchInputElement = document.getElementById("searchInput");
    var searchInput = searchInputElement ? searchInputElement.value : "";

    if (searchInput) {
        window.location.href = `search.html?query=${encodeURIComponent(searchInput)}`;
    } else {
        alert("Please enter a search term.");
    }

}

// gets the list of all markets from API and renders them
async function fetchMarketDirectory() {
    const marketListContainer = document.getElementById('marketList');

    if (!marketListContainer) return;

    try {
        const response = await fetch(API_BASE_URL + API_MARKETS_ENDPOINT);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        console.log('Market API call worked! Data recieved:', result);

        if (result.success && Array.isArray(result.data)) {
            renderMarkets(result.data, marketListContainer);
        } else {
            console.log('Error: API response was not successful or data format was unexpected.');
            console.log('Unexpected API response:', result);
        } 

    } catch {
        console.log(`Error: Could not connect to the server or fetch data. Ensure your Node.js server is running.`);
        console.log('Full fetch error:');
    }
}

// gets specific vendor and product details for a specific market
async function fetchMarketDetails(marketId) {
    const detailOverlay = document.getElementById('details_overlay');
    const marketDetailName = document.getElementById('marketName'); 
    const marketDetailAddress = document.getElementById('marketAddress'); 
    const vendorsListContainer = document.getElementById('vendorsList'); 
    const productsListContainer = document.getElementById('productsList'); 

    if (!detailOverlay) return;

    // Show overlay
    detailOverlay.style.display = 'block';
    
    // Set loading text on the main elements
    marketDetailName.textContent = 'Loading details...';
    if (marketDetailAddress) marketDetailAddress.textContent = '';
    if (vendorsListContainer) vendorsListContainer.innerHTML = '<h4>Vendors:</h4><p>Loading...</p>';
    if (productsListContainer) productsListContainer.innerHTML = '<h4>Products:</h4><p>Loading...</p>';


    try {
        const response = await fetch(`${API_BASE_URL}/api/market/${marketId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load market details.');
        }

        console.log('Market Details Loaded:', result);
        currentMarketDetails = result.data; // store data before rendering
        renderMarketDetails(currentMarketDetails, null);

    } catch (error) {
        console.error('Error fetching market details:', error);
        if (marketDetailName) marketDetailName.textContent = `Error:`;
        if (marketDetailAddress) marketDetailAddress.textContent = `Could not load market details (${error.message})`;
        if (vendorsListContainer) vendorsListContainer.innerHTML = '';
        if (productsListContainer) productsListContainer.innerHTML = '';
    }

};


// Renders market details for specific market
function renderMarketDetails(rows, selectedVendorName = null) {

    const marketDetailName = document.getElementById('marketName'); 
    const marketDetailAddress = document.getElementById('marketAddress'); 
    const vendorsListContainer = document.getElementById('vendorsList'); 
    const productsListContainer = document.getElementById('productsList'); 
    
    if (rows.length === 0) {
        if (marketDetailName) marketDetailName.textContent = 'Market Details';
        if (marketDetailAddress) marketDetailAddress.textContent = 'This market currently has no products listed.';
        if (vendorsListContainer) vendorsListContainer.innerHTML = '<h4>Vendors:</h4><ul></ul>';
        if (productsListContainer) productsListContainer.innerHTML = '<h4>Products:</h4><ul></ul>';
        return;
    }

    // get basic market info
    const marketName = rows[0].market_name;
    const marketLocation = rows[0].location;

    // aggregate unique data
    const uniqueVendors = new Map(); // Map<vendor_id, vendor_name>
    const allProducts = []; // Array to store all unique products for filtering
    
    // re-aggregate by vendor to show product details later
    rows.forEach(row => {
        uniqueVendors.set(row.vendor_id, row.vendor_name);

        // collect unique products with link to their vendor
        if (row.product_name) {
            allProducts.push({
                product_name: row.product_name,
                vendor_name: row.vendor_name
            });
        }
    });

    // products filtered based on selected vendor
    const productsToDisplay = new Set();
    
    if (selectedVendorName) {
        // Only show products sold by the selected vendor
        rows.forEach(row => {
            if (row.vendor_name === selectedVendorName && row.product_name) {
                productsToDisplay.add(row.product_name);
            }
        });
    } else {
        // Show all unique products if no vendor is selected
        allProducts.forEach(product => {
            productsToDisplay.add(product.product_name);
        });
    }
    // Convert Set to Array and sort
    const uniqueProductsArray = Array.from(productsToDisplay).sort();


    // update headers
    if (marketDetailName) marketDetailName.textContent = marketName;
    if (marketDetailAddress) marketDetailAddress.textContent = marketLocation;

    // build vendor list
    if (vendorsListContainer) {
        let vendorListHtml = Array.from(uniqueVendors.values())
            .sort() // Sort alphabetically
            // Apply a CSS class if this vendor is currently selected
            .map(name => {
                const isSelectedClass = name === selectedVendorName ? ' vendorItem-selected' : '';
                // attach a click handler to call this function again with the vendors name
                return `<li class="vendorItem${isSelectedClass}" onclick="renderMarketDetails(currentMarketDetails, '${name.replace(/'/g, "\\'")}')">${name}</li>`;
            })
            .join('');

        // Add an 'All Products' option to reset the filter
        const allProductsClass = !selectedVendorName ? ' vendorItem-selected' : '';
        const allProductsBtn = `<li class="vendorItem${allProductsClass}" onclick="renderMarketDetails(currentMarketDetails, null)">All Products</li>`;

        vendorsListContainer.innerHTML = `
            <h4>${uniqueVendors.size} Vendors:</h4>
            <ul>${allProductsBtn}${vendorListHtml}</ul>
        `;
    }

    // build product list
    if (productsListContainer) {
        let productListHtml = uniqueProductsArray
            .map(name => {
                // Determine the vendor for this product to pass to the addToCart function
                const productDetail = rows.find(row => row.product_name === name);
                const vendorNameForProduct = productDetail ? productDetail.vendor_name : 'Unknown Vendor';
                
                // FIX LATER: price (2.00) is just a placeholder for now
                return `<li onclick="addToCart('${name.replace(/'/g, "\\'")}', '${vendorNameForProduct.replace(/'/g, "\\'")}', 2.00)">${name}</li>`;
            })
            .join('');

        const productHeader = selectedVendorName 
            ? `${uniqueProductsArray.length} Product(s) by ${selectedVendorName}:`
            : `${uniqueProductsArray.length} Product(s):`;

        productsListContainer.innerHTML = `
            <h4>${productHeader}</h4>
            <ul>${productListHtml}</ul>
        `;
    }
}

// Puts market data into the directory list
function renderMarkets(markets, container) {
    if (markets.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No markets found in the database.</p>';
        return;
    }

    container.innerHTML = '';

    markets.forEach(market => {
        const marketItem = document.createElement('div');
        marketItem.className = 'marketItem';

        marketItem.dataset.marketId = market.market_id;

        const vendorCount = market.vendor_count !== undefined ? market.vendor_count : '...';   
        const productCount = market.product_count !== undefined ? market.product_count : '...';

        // openHours is a placeholder time
        marketItem.innerHTML = `
            <h2 id="marketName">${market.market_name}</h2>
            <p id="marketAddress">${market.location}</p>
            <p id="openHours">Open Hours: 9AM - 4PM</p>
            <p id="marketVendors">${vendorCount} Vendors</p>
            <p id="marketProducts">${productCount} Products</p>
        `;

        container.appendChild(marketItem);

        // Event listener to call the fetchMarketDetails function
        marketItem.addEventListener('click', () => {
            const marketId = marketItem.dataset.marketId;
             if (marketId) {
                fetchMarketDetails(marketId);
             }
        });
    });

}

// function to update the cart icon count
function updateCartCount() {
    const totalItems = shoppingCart.reduce((acc, item) => acc + item.quantity, 0);
    const cartCountElement = document.getElementById('cart_count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Add an item in the shopping cart
function addToCart(productName, vendorName, price) {
    const existingItem = shoppingCart.find(item => item.name === productName && item.vendor === vendorName);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        shoppingCart.push({
            name: productName,
            vendor: vendorName,
            price: price, // Placeholder $2.00 for now
            quantity: 1
        });
    }

    // Refresh cart display and the icon count
    renderCart();
    updateCartCount();
    saveCartToLocalStorage();
    console.log(`${productName} added to cart. Current cart:`, shoppingCart);
}

// Render the contents of the shopping cart
function renderCart() {
    const cartItemsContainer = document.querySelector('#cartItems .cartItems');
    const totalAmountSpan = document.getElementById('totalAmount');
    
    if (!cartItemsContainer || !totalAmountSpan) return;

    // Calculate total price
    const total = shoppingCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update the total amount displayed
    totalAmountSpan.textContent = `$${total.toFixed(2)}`;

    // Generate HTML for cart items
    let itemsHtml = shoppingCart.map((item, index) => {
        // Clean up string for use in function call
        const cleanedName = item.name.replace(/'/g, "\\'");

        return `
            <div class="itemRow" data-index="${index}">
                <span class="itemName">${item.name}</span>
                <div class="quantityControls">
                    <button class="decreaseBtn" onclick="updateQuantity(${index}, -1)">&lt;</button>
                    <span class="itemQuantity">${item.quantity}</span>
                    <button class="increaseBtn" onclick="updateQuantity(${index}, 1)">&gt;</button>
                </div>
                <span class="itemPrice">$${(item.price * item.quantity).toFixed(2)}</span>
                <span class="removeBtn" onclick="removeFromCart(${index})">X</span>
            </div>
        `;
    }).join('');

    // Clear existing content and render new items
    cartItemsContainer.innerHTML = itemsHtml;
}

// Remove an item from the cart
function removeFromCart(index) {
    shoppingCart.splice(index, 1); // Remove 1 item at the given index
    saveCartToLocalStorage();
    renderCart();
    updateCartCount();
}

// Update an item's quantity
function updateQuantity(index, delta) {
    const item = shoppingCart[index];
    if (item) {
        item.quantity += delta;
        
        // Remove item if quantity drops to 0 or below
        if (item.quantity <= 0) {
            removeFromCart(index);
        } else {
            saveCartToLocalStorage();
            renderCart();
            updateCartCount();
        }
    }
}

