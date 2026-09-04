const API_BASE_URL = 'http://localhost:3000'; 
const API_SEARCH_ENDPOINT = '/api/search';
const API_MARKET_ENDPOINT = '/api/market';

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


document.addEventListener('DOMContentLoaded', () => {
    const checkoutOverlay = document.getElementById('checkout_overlay');
    const closeCartBtn = document.getElementById('close_checkout');
    const cartIcon = document.getElementById('cart_icon');
    const cartCount = document.getElementById('cart_count');
    const checkoutForm = document.getElementById('checkoutForm');

    // function to show cart overlay
    function showCartOverlay() {
        if (checkoutOverlay) {
            checkoutOverlay.style.display = 'block';
            renderCart(); // Call the new render function here
        }
    }

    // function to hide cart overlay
    function hideCartOverlay() {
        if (checkoutOverlay) {
            checkoutOverlay.style.display = 'none';
        }
    }   

    // listener for close button
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', hideCartOverlay);
    }
    
    // listener for cart icon and count
    if (cartIcon) {
        cartIcon.addEventListener('click', showCartOverlay);
    }
    if (cartCount) {
        cartCount.addEventListener('click', showCartOverlay);
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

// parse the vendor name from the product description string
function extractVendorName(description) {
    // Description format from server.js is: "Sold at: [Market Name] (by [Vendor Name])"
    const match = description.match(/\(by\s(.*?)\)/);
    if (match && match[1]) {
        return match[1].trim();
    }
    return null;
}

// handle standard Market clicks (fetch and render unfiltered)
function fetchMarketDetailsAndRender(marketId) {
    fetchMarketDetails(marketId)
        .then(() => {
            if (currentMarketDetails) {
                // Unfiltered view
                renderMarketDetails(currentMarketDetails, null);
            }
        })
        .catch(error => {
            console.error('Error fetching market details for Market click:', error);
            // Error handled inside fetchMarketDetails
        });
}

// fetches market details, then triggers a re-render with a vendor filter
function fetchMarketDetailsAndFilter(marketId, vendorName) {
    // returns a Promise so we can chain the render action
    fetchMarketDetails(marketId)
        .then(() => {
            // Check if data was successfully fetched and stored
            if (currentMarketDetails) {
                // Re-render the market details using the stored data, filtered by the selected vendor
                renderMarketDetails(currentMarketDetails, vendorName);
            }
        })
        .catch(error => {
            console.error('Error during fetchMarketDetailsAndFilter chain:', error);
        });
}

function showDetailsOverlay() {
    const detailOverlay = document.getElementById('details_overlay');
    if (detailOverlay) {
        detailOverlay.style.display = 'block';
    }
}

function hideDetailsOverlay() {
    const detailOverlay = document.getElementById('details_overlay');
    if (detailOverlay) {
        detailOverlay.style.display = 'none';
        
        // Clear content when closing
        document.getElementById('marketName').textContent = 'Loading...';
        document.getElementById('marketAddress').textContent = '';
        document.getElementById('marketHours').textContent = 'Hours: 9AM - 4PM'; // Placeholder hours
        document.getElementById('vendorsList').innerHTML = '<h4>Vendors:</h4><ul></ul>';
        document.getElementById('productsList').innerHTML = '<h4>Products:</h4><ul></ul>';

        // reset stored data
        currentMarketDetails = null; 
    }
}

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
    const allProducts = []; // Array to store all unique products for filtering later

    // Populate vendors and products based on the full dataset (rows)
    rows.forEach(row => {
        // Collect unique vendors
        uniqueVendors.set(row.vendor_id, row.vendor_name);
        
        // Collect all products with their vendor link
        if (row.product_name) {
            allProducts.push({
                product_name: row.product_name,
                vendor_name: row.vendor_name
            });
        }
    });

    // --- Filter products based on selected vendor ---
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

    // build vendor list (only rebuilt if no vendor is selected)
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
                // Need to find the row that contains the product name to get the vendor
                const productDetail = rows.find(row => row.product_name === name);
                const vendorNameForProduct = productDetail ? productDetail.vendor_name : 'Unknown Vendor';
                
                // ADDED: onclick handler to call the addToCart function
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

// fetch market details from the API
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

    return new Promise(async (resolve, reject) => {
    try {
        const response = await fetch(`${API_BASE_URL}${API_MARKET_ENDPOINT}/${marketId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load market details.');
        }

        // store the full data before rendering
        currentMarketDetails = result.data;
        resolve();

    } catch (error) {
        console.error('Error fetching market details:', error);
        if (marketDetailName) marketDetailName.textContent = `Error:`;
        if (marketDetailAddress) marketDetailAddress.textContent = `Could not load market details (${error.message})`;
        if (vendorsListContainer) vendorsListContainer.innerHTML = '';
        if (productsListContainer) productsListContainer.innerHTML = '';
    }
    });
}



// Gets search query from URL
function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('query');
}

// Puts search results into the results container
function renderSearchResults(results, container) {
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = '<p class="no-results">No results found for your search query.</p>';
        return;
    }

    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'searchResult';

        let buttonAction = '';
        let buttonText = 'View Details';

        if (item.type === 'Market') {
            // For a Market result
            buttonAction = `fetchMarketDetailsAndRender(${item.id})`;
            buttonText = 'Go to Details';
        } else if (item.type === 'Vendor') {
            const marketId = item.market_id; 
            const vendorName = item.name; // item.name contains the vendor name

            if (marketId && vendorName) {
                // fetch and filter the market view
                buttonAction = `fetchMarketDetailsAndFilter(${marketId}, '${vendorName.replace(/'/g, "\\'")}')`;
                buttonText = 'View Vendor';
            } else {
                // Fallback if data is missing
                buttonAction = `console.error('Vendor result missing market ID or name. Check server.js vendorQuery.');`;
                buttonText = 'Data Error';
            }
        } else if (item.type === 'Product') {
             // Placeholder action for Product
            const marketId = item.market_id; 
            const vendorName = extractVendorName(item.description);

            if (marketId && vendorName) {
                 // fetch and filter the market view.
                 buttonAction = `fetchMarketDetailsAndFilter(${marketId}, '${vendorName.replace(/'/g, "\\'")}')`;
                 buttonText = 'View Product';
            } else {
                 // fallback
                 buttonAction = `console.error('Product result missing market ID or vendor name.');`;
                 buttonText = 'Data Error';
            }
        }

        resultItem.innerHTML = `
            <h3 class="resultType">${item.type}</h3>
            <h3 class="resultName">${item.name}</h3>
            <p class="resultDescription">${item.description}</p>
            <button onclick="${buttonAction}" type="button">${buttonText}</button>
        `;

        container.appendChild(resultItem);
    });
}

// Gets search results from API
async function performSearch() {
    const searchTerm = getSearchQuery();
    const resultsContainer = document.getElementById('results');
    const titleElement = document.querySelector('#search_main h1');

    if (titleElement) {
        titleElement.textContent = `Search Results for "${searchTerm || '...'}"`;
    }

    if (!searchTerm || !resultsContainer) {
        if (resultsContainer) {
            resultsContainer.innerHTML = '<p class="no-results">Please enter a search term and try again.</p>';
        }
        return;
    }

    resultsContainer.innerHTML = '<p class="loading">Loading results...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}${API_SEARCH_ENDPOINT}?q=${encodeURIComponent(searchTerm)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && Array.isArray(result.data)) {
            renderSearchResults(result.data, resultsContainer);
        } else {
            resultsContainer.innerHTML = '<p class="no-results">Search failed. No data received.</p>';
            console.error('Search API returned success: false or invalid data structure.');
        }
    } catch (error) {
        console.error('Error during API call for search results:', error);
        resultsContainer.innerHTML = '<p class="no-results">Could not connect to the server to perform search.</p>';
    }
}


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

// make sure initial search is performed when the page loads, and attach close listener
document.addEventListener('DOMContentLoaded', () => {
    performSearch();
    
    // Attach listener for the close details button
    const closeDetailBtn = document.getElementById('close_details');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', hideDetailsOverlay);
    }

});

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
