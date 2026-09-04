/* -------------------------------------------------------------------

Make sure Node.js is installed first! -> go to https://nodejs.org/en/download
                                         and download the installer for your system.

Express, mysql2, and cors are downloaded through terminal first
these are the commands ->   
                          1. Create project directory -> mkdir server-api-thesch
                          2. Navigate into it -> cd server-api-thesch
                          3. Start node -> npm init -y
                          4. install these in the server:
                                    npm install express   
                                    npm install mysql2
                                    npm install cors
                          5. Create server.js file inside wherever your project directory is
                          6. Make sure to add the password for your mySQL so it can connect, save file
                          7. In terminal, still in the same directory, start the server
                             using this command -> node server.js
                             And you should get this in terminal "API call received: /api/markets"

If you download the mn_market_link folder and open index.html
***New Note*** the website folder has to be in the same directory as server.js or cart doesn't work
               mine are both just in C:\Users\Brittany\

               Open site through port (should be http://localhost:3000 or whatever port number your using)
               It should bring you to the main page automatically

**Note** to close the server when you're done you press ctrl+C on windows, 
         I don't know how on Mac :(

------------------------------------------------------------------- */

const express = require('express');
const mysql = require('mysql2/promise'); // Using the promise-based version
const cors = require('cors'); // Required for cross-origin requests

const app = express();
const port = 3000; // Any free port works

const path = require('path'); // for files from the 'pages' directory
app.use(express.static(path.join(__dirname, 'mn_market_link')));

// redirects to main page
app.get('/', (req, res) => {
    res.redirect('/pages/index.html'); 
});

app.use(cors());
app.use(express.json()); // for recieving cart info from the site

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // mySQL server password
    database: 'theSCH',
});

// Endpoint to fetch all Market data
app.get('/api/markets', async (req, res) => {
    const query = `
        SELECT
            M.market_id,
            M.market_name,
            M.location,
            COUNT(DISTINCT MV.vendor_id) AS vendor_count,
            COUNT(DISTINCT VP.product_id) AS product_count
        FROM
            Market M
        LEFT JOIN
            Market_Vendors MV ON M.market_id = MV.market_id
        LEFT JOIN
            Vendor_Products VP ON MV.vendor_id = VP.vendor_id
        GROUP BY
            M.market_id, M.market_name, M.location
        ORDER BY
            M.market_id;
    `;

    try {
        console.log('API call received: /api/markets');
        const [rows] = await pool.execute(query);

        // Send the resulting data back to the client as JSON
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Database query error:', err);
        // Send a generic 500 status back to the client for security
        res.status(500).json({ success: false, message: 'Server error while fetching markets.' });
    }
});

// Endpoint to fetch data from a specific market
app.get('/api/market/:id', async (req, res) => {
    const marketId = req.params.id;
    const query = `
        SELECT
            M.market_name,
            M.location,
            V.vendor_id,
            V.vendor_name,
            P.product_id,
            P.product_name,
            VP.price,
            VP.quantity
        FROM
            Market M
        JOIN
            Market_Vendors MV ON M.market_id = MV.market_id
        JOIN
            Vendor V ON MV.vendor_id = V.vendor_id
        JOIN
            Vendor_Products VP ON V.vendor_id = VP.vendor_id
        JOIN
            Product P ON VP.product_id = P.product_id
        WHERE
            M.market_id = ?
        ORDER BY
            V.vendor_name, P.product_name;
    `;

    try {
        console.log(`API call received: /api/market/${marketId}`);
        const [rows] = await pool.execute(query, [marketId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Market not found or has no vendors/products.' });
        }

        res.json({ success: true, market_id: marketId, data: rows });

    } catch (err) {
        console.error(`Database query error in /api/market/${marketId}:`, err);
        res.status(500).json({ success: false, message: 'Server error while fetching market details.' });
    }

});

// Endpoint to search through all markets, vendors, and products
app.get('/api/search', async (req, res) => {
    const searchTerm = req.query.q || ''; 
    const wildcardTerm = `%${searchTerm}%`;

    if (!searchTerm) {
        return res.status(400).json({ success: false, message: 'Missing search query parameter.' });
    }

    try {
        console.log(`API call received: /api/search with query: ${searchTerm}`);
        
        // --- Markets Search ---
        const marketQuery = `
            SELECT 
                market_id AS id, 
                market_name AS name, 
                location AS description, 
                'Market' AS type 
            FROM Market 
            WHERE market_name LIKE ? OR location LIKE ?;
        `;
        
        // --- Vendors Search ---
        const vendorQuery = `
            SELECT 
                V.vendor_id AS id,
                V.vendor_name AS name,
                -- Return all markets the vendor is at, plus the vendor name in the description
                CONCAT('Located at: ', GROUP_CONCAT(M.market_name SEPARATOR ', '), ' (Vendor: ', V.vendor_name, ')') AS description,
                'Vendor' AS type,
                -- select the lowest market_id to use for the overlay
                MIN(M.market_id) AS market_id
            FROM Vendor V
            JOIN Market_Vendors MV ON V.vendor_id = MV.vendor_id
            JOIN Market M ON MV.market_id = M.market_id
            WHERE V.vendor_name LIKE ?
            GROUP BY V.vendor_id, V.vendor_name;
        `;
        
        // --- Products Search (Find markets and vendors that sell the product) ---
        // The results should show what markets and vendors have that product, which is why it's complicated
        const productQuery = `
            SELECT 
                P.product_id AS id,
                P.product_name AS name,
                CONCAT('Sold at: ', M.market_name, ' (by ', V.vendor_name, ')') AS description,
                'Product' AS type,
                M.market_id,
                V.vendor_id
                FROM Product P
                JOIN Vendor_Products VP ON P.product_id = VP.product_id
                JOIN Vendor V ON VP.vendor_id = V.vendor_id
                JOIN Market_Vendors MV ON V.vendor_id = MV.vendor_id
                JOIN Market M ON MV.market_id = M.market_id
                WHERE P.product_name LIKE ?;
        `;

        // Execute all three queries
        const [marketRows] = await pool.execute(marketQuery, [wildcardTerm, wildcardTerm]);
        const [vendorRows] = await pool.execute(vendorQuery, [wildcardTerm]);
        const [productRows] = await pool.execute(productQuery, [wildcardTerm]);

        // Combine and structure results
        const combinedResults = [
            ...marketRows,
            ...vendorRows,
            ...productRows
        ];

        res.json({ success: true, data: combinedResults });

    } catch (err) {
        console.error('Database query error in /api/search:', err);
        res.status(500).json({ success: false, message: 'Server error during search operation.' });
    }
});


////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////  TRANSACTION CONNECTION  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

// LINK to info on stored procedures: https://www.w3schools.com/sql/sql_stored_procedures.asp

// POST endpoint for checkout // Needs a Stored Procedure in the db
app.post('/api/checkout', async (req, res) => {
    const cartItems = req.body.cart;
    // still need to determine the customer ID (maybe just auto-increment for now?)
    const customerId = 1; // Placeholder number

    if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    try {
        const orderResults = [];
        let success = true;

        for (const item of cartItems) {
            // Find IDs from names
            const findIdsQuery = `
                SELECT 
                    P.product_id, 
                    V.vendor_id,
                    MV.market_id
                FROM Product P, Vendor V, Market_Vendors MV
                WHERE P.product_name = ? AND V.vendor_name = ? 
                AND V.vendor_id = MV.vendor_id 
                LIMIT 1;
            `;
            const [ids] = await pool.execute(findIdsQuery, [item.name, item.vendor]);

            if (ids.length === 0) {
                // if we can't find the product/vendor combo
                success = false;
                orderResults.push({ status: 'FAILURE', message: `Product/Vendor combination not found for ${item.name}.` });
                break; 
            }
            
            const { product_id, vendor_id, market_id } = ids[0];
            
            // Call the Stored Procedure for the current item
            // Syntax is: CALL ProcedureName(arg1, arg2, ...) // USING A PLACEHOLDER NAME FOR NOW // "ProcedureName" will be whatever we name the procedure
            const [procResult] = await pool.execute(
                'CALL ProcessPreOrder(?, ?, ?, ?, ?)',
                [market_id, vendor_id, product_id, customerId, item.quantity]
            );

            // The stored procedure returns a result set with status/message
            const resultRow = procResult[0][0]; 
            orderResults.push(resultRow);

            if (resultRow.status !== 'SUCCESS') {
                success = false;
                break; // Stop processing other items if one fails a check (like stock)
            }
        }

        if (success) {
            res.json({ success: true, message: 'All items pre-ordered successfully.', results: orderResults });
        } else {
            // Send failure message
            const failure = orderResults.find(r => r.status === 'FAILURE') || { message: 'Order processing failed.' };
            res.status(400).json({ success: false, message: failure.message, results: orderResults });
        }

    } catch (error) {
        console.error('API Error during Stored Procedure call:', error);
        // catches connection errors
        res.status(500).json({ success: false, message: 'Server error during transaction processing.' });
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////


// Start the server
app.listen(port, () => {
    console.log(`The SCH API is running on http://localhost:${port}`);
});
