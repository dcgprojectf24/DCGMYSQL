/*---------- Created by Lui Rabideau, Xin Lin, Tassia Cocoran, Emma Sharp, and Jessica Bandol ----------*/
/* Incorporated into the design from W3schools: W3.CSS 4.15 December 2020 by Jan Egil and Borge Refsnes */
/*------------------------- Lui Rabideau's F2023 ITM352 Assignment 3 Template --------------------------*/
/*-------------------------------------- UHM ITM354 Final Project --------------------------------------*/

var express = require('express');
var app = express();
var myParser = require("body-parser");
var mysql = require('mysql');
const session = require('express-session');

app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));

let userLoggedin = {};

const fs = require('fs');
const { type } = require('os');

app.use(express.static('./public'));
app.use(myParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (typeof req.session.reservation === 'undefined') {
    req.session.reservation = {};
  }
  next(); // Move to the next middleware or route handler
});

// monitor all requests and make a reservation
app.all('*', function (request, response, next){// this function also makes reservations
  console.log(request.method + ' to ' + request.path);

  next();
});

/*---------------------------------- DATABASE CONNECTION ----------------------------------*/
console.log("Connecting to localhost..."); 
var con = mysql.createConnection({// Actual DB connection occurs here
  host: '127.0.0.1',
  user: "root",
  port: 3306,
  database: "hpc",
  password: ""
});

con.connect(function (err) {// Throws error or confirms connection
  if (err) throw err;
 console.log("Connected!");
});

/*---------------------------------- LOGIN/LOGOUT/REGISTER ----------------------------------*/

app.post('/login', (request, response) => { // Login route
  const the_username = request.body.username.toLowerCase();
  const the_password = request.body.password;

  // Secure query to validate user credentials
  const query = `
    SELECT User_ID, User_Password 
    FROM users 
    WHERE User_ID = ?;
  `;

  con.query(query, [the_username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return response.status(500).send('Internal Server Error');
    }

    // Check if user exists
    if (results.length === 0) {
      return response.status(401).send('Invalid username or password');
    }

    const user = results[0];

    // Password validation
    if (user.User_Password !== the_password) {
      return response.status(401).send('Invalid username or password');
    }

    // Fetch Account_Name for the user
    const query2 = `
      SELECT Account_Name 
      FROM account 
      WHERE Account_ID IN (
        SELECT Account_ID FROM users WHERE User_ID = ?
      );
    `;

    con.query(query2, [the_username], (err, nameResults) => {
      if (err) {
        console.error('Database error:', err);
        return response.status(500).send('Internal Server Error 2');
      }

      if (nameResults.length > 0) {
        const accountName = nameResults[0].Account_Name; // Extract the name
        request.session.Account_Name = accountName; // Store clean name in session
        console.log(`Account_Name ${accountName} stored in session.`);

        // Fetch Account_ID for the user
        const query1 = `
          SELECT Account_ID 
          FROM account 
          WHERE Account_ID IN (
            SELECT Account_ID FROM users WHERE User_ID = ?
          );
        `;

        con.query(query1, [the_username], (err, accountResults) => {
          if (err) {
            console.error('Database error:', err);
            return response.status(500).send('Internal Server Error 1');
          }

          if (accountResults.length > 0) {
            const accountID = accountResults[0].Account_ID;

            // Store Account_ID in the session
            request.session.Account_ID = accountID;

            console.log(`Account_ID ${accountID} stored in session.`);

            // Redirect to account page
            response.cookie("loggedIn", 1, { expire: Date.now() + 30 * 60 * 1000 }); // make a logged in cookie
            return response.redirect('/account.html');
          } else {
            return response.status(404).send('Account not found.');
          }
        });
      } else {
        return response.status(404).send('Account name not found.');
      }
    });
  });
});


app.post('/register', function (request, response) { 
  let the_username = request.body.username.toLowerCase();
  let the_password = request.body.password;
  let lname = request.body.lastname;
  let fname = request.body.firstname;
  let fullname = fname + ' ' + lname;

  // Generate a unique Account_ID
  let accountID = generateUniqueAccountID();

  // Query to insert data into the `account` table
  const query = `
    INSERT INTO account (Account_ID, Account_Email, Account_Name) VALUES
    (?, ?, ?);
  `;

  // Query to insert data into the `users` table
  const query1 = `
    INSERT INTO users (User_ID, User_Password, Account_ID) VALUES
    (?, ?, ?);
  `;

  // Execute the first query to insert into the account table
  con.query(query, [accountID, the_username, fullname], (err) => {
    if (err) {
      console.error('Database error in account table:', err); 
      return response.status(500).send('Error creating account.');
    }

    // Execute the second query to insert into the users table
    con.query(query1, [the_username, the_password, accountID], (err) => {
      if (err) {
        console.error('Database error in users table:', err);
        return response.status(500).send('Error creating user.');
      }
// Store Account_ID and Name in the session
request.session.Name = fullname;
request.session.Account_ID = accountID;
      // Redirect to account page if both queries are successful
      response.cookie("loggedIn", 1, { expire: Date.now() + 30 * 60 * 1000 });
      console.log(`Account created successfully with Account_ID: ${accountID}`);
      return response.redirect('/account.html');
    });
  });
});


app.get('/logout', function (request, response){// Redirects user to home page after logging out
  response.redirect(`./index.html`)
});

app.post('/loginLibrarian', (request, response) => {// Login route
  const the_username = request.body.username.toLowerCase();
  const the_password = request.body.password;

  // Secure query to validate user credentials
  const query = `
    SELECT Librarian_Email, Librarian_Password 
    FROM librarian 
    WHERE Librarian_Email = ?;
  `;

  con.query(query, [the_username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return response.status(500).send('Internal Server Error');
    }

    // Check if user exists
    if (results.length === 0) {
      return response.status(401).send('User does not exist');
    }

    const user = results[0];

    // Password validation (replace with bcrypt.compare for hashed passwords)
    if (user.Librarian_Password !== the_password) {
      return response.status(401).send('Invalid username or password');
    }

    // Fetch Account_ID for the user
    const query1 = `
      SELECT Librarian_ID 
      FROM librarian 
      WHERE Librarian_Email = '${the_username}';
    `;

    con.query(query1, [the_username], (err, accountResults) => {
      if (err) {
        console.error('Database error:', err);
        return response.status(500).send('Internal Server Error');
      }

      if (accountResults.length > 0) {
        const accountID = accountResults[0].Account_ID;

        // Store Account_ID in the session
        request.session.Account_ID = accountID;

        console.log(`Account_ID ${accountID} stored in session.`);

        // Redirect to account page
        response.cookie("loggedIn", 1, {expire: Date.now() + 30 * 60 * 1000});// make a logged in cookie
        response.cookie("librarianC", 1, {expire: Date.now() + 30 * 60 * 1000});// make a librarian cookie
        response.redirect('/advanced.html');
      } else {
        response.status(404).send('Account not found.');
      }
    });
  });
});

/*---------------------------------- MAPS SQL ----------------------------------*/

app.get("/geo", (req, res) => {
  const search = req.query.search; // Use 'search' for query parameter
  const page = parseInt(req.query.page) || 1; // Default to page 1

  if (!search) {
      return res.status(400).send("Search term is required.");
  }

  const query = `
      SELECT Record_ID, Title, D_name, Date, Subject, Description, Medium, Language 
      FROM record r 
      INNER JOIN Department d ON r.Department_ID = d.Department_ID
      WHERE Geo_Location LIKE '%${search}%';
  `;

  con.query(query, (err, result) => {
      if (err) throw err;
      // Store results in session
      req.session.results = result;
      req.session.search = search;
      req.session.what = 'geo';
      // Redirect to geo.html with the query parameters
      res.redirect(`/results.html?search=${encodeURIComponent(search)}&page=${page}`);
  });
});

app.get("/get-session-data", (req, res) => {
  if (!req.session.results || !req.session.search) {
      return res.status(404).json({ error: "No session data available." });
  }
  res.json({
      results: req.session.results, 
      search: req.session.search
  });
  console.log(req.session);
});

app.get('/get-session-details', (req, res) => {
  if (req.session.Account_ID) {
      res.json({ Account_ID: req.session.Account_ID, Account_Name: req.session.Account_Name });
  } else {
      res.status(401).json({ error: "Account number not found in session." });
  }
});

/*---------------------------------- SEARCH SQL ----------------------------------*/

app.post("/executeSearch", (req, res) => {
  const search = req.body.searchInput;
  const type = req.body.searchType;
  const format = req.body.format;

  console.log(format);

  const query = `
    SELECT Record_ID, Title, D_name, Date, Subject, Description, Medium, Language 
    FROM record r 
    INNER JOIN Department d ON r.Department_ID = d.Department_ID
    WHERE ${type} LIKE '%${search}%' AND Medium = '${format}';
    `;

  con.query(query, (err, result) => {
    if (err) throw err;
    // Store results in session
    req.session.results = result;
    req.session.search = search;
    req.session.type = type;
    req.session.format = format;
    req.session.what = 'ser';
    // Redirect to results.html with the query parameters
    res.redirect(`/results.html?search=${encodeURIComponent(search)}`);
  });
});

/*----------------------------------- REQUESTING -----------------------------------*/

app.post("/nextPage", (req, res) => {
  const search = req.session.search;
  const what = req.session.what;
  let page = parseInt(req.body.page) || 1; // Parse the page number as an integer, default to 1
  page += 1; // Correct increment

  const limit = 10; // Default to 10 records per page
  const offset = (page - 1) * limit; // Calculate offset for SQL query

  let query; // Declare the query variable in a broader scope

  if (what === 'geo') {
    query = `
      SELECT Record_ID, Title, Department_Name, Year_Range, Subject, Description, Medium, Language 
      FROM RECORDS 
      WHERE Geo_Location LIKE '%${search}%'
      LIMIT ${limit} OFFSET ${offset};
    `;
  } else {
    const type = req.session.type;
    const format = req.session.format;
    query = `
      SELECT Record_ID, Title, Department_Name, Year_Range, Subject, Description, Medium, Language 
      FROM RECORDS 
      WHERE ${type} LIKE '%${search}%' AND Medium = '${format}' 
      LIMIT ${limit} OFFSET ${offset};
    `;
  }

  // Execute the query
  con.query(query, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Internal Server Error");
    }
    req.session.results = result;// Store results in session
    // Redirect to results.html with updated query parameters
    res.redirect(`/results.html?search=${encodeURIComponent(search)}&page=${page}`);
  });
});

app.post("/request", (req) => {
  let data = req.body;

  // Extract all keys (RecordIDs) from the incoming request body
  const recordIDs = Object.keys(data);

  console.log("Extracted RecordIDs:", recordIDs);

  // SQL query to insert a RecordID into the Contains table
  const query = `INSERT INTO contains (Record_ID) VALUES (?)`;

  // Loop through each RecordID and insert it into the database
  recordIDs.forEach((recordID) => {
    con.query(query, [recordID], (err) => {
      if (err) {
        console.error(`Error inserting RecordID '${recordID}':`, err);
      } else {
        console.log(`Inserted RecordID '${recordID}' successfully.`);
      }
    });
  });
});

app.get('/get-user-reservations', (req, res) => {
  // Retrieve Account_Name or Account_ID from the user session
  const accountId = req.session.Account_ID;

  if (!accountId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // Query to fetch records linked to the user's Account_ID
  const query = `
    SELECT r.Record_ID, r.Title, r.Department_Name, r.Year_Range, 
           r.Subject, r.Description, r.Medium, r.Language
    FROM Records r
    JOIN Contains c ON r.Record_ID = c.Record_ID
    JOIN Reservation res ON c.Reservation_ID = res.Reservation_ID
    WHERE res.Account_ID = ?;
  `;

  // Execute the query with Account_ID as a parameter
  con.query(query, [accountId], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Send the fetched data to the client
    res.json({ records: results });
  });
});


// Endpoint to finalize the request
app.post('/finalizeRequest', (req, res) => {
  const reservationID = generateUniqueReservationID();
  const date = getCurrentDate();
  const accountID = req.body.accountNumber;

  // Query 0: Insert into Reservation
  const query0 = `
    INSERT INTO Reservation 
    (Reservation_ID, Account_ID, Reservation_Start_Date, Reservation_Status, Reservation_Fulfilled_Date) 
    VALUES (?, ?, ?, 'Submitted', NULL)
  `;

  // Query 1: Update contains table
  const query1 = `
    UPDATE contains 
    SET Reservation_ID = ? 
    WHERE Reservation_ID IS NULL OR Reservation_ID = '';
  `;

  // Run Query 0 (INSERT)
  con.query(query0, [reservationID, accountID, date], (err, result) => {
    if (err) {
      console.error('Error inserting into Reservation:', err.message);
      return res.status(500).send('Failed to finalize request: INSERT failed.');
    }

    console.log('Reservation created successfully.');

    // Run Query 1 (UPDATE) only after Query 0 succeeds
    con.query(query1, [reservationID], (err, updateResult) => {
      if (err) {
        console.error('Error updating contains table:', err.message);
        return res.status(500).send('Failed to finalize request: UPDATE failed.');
      }

      console.log(`Assigned Reservation_ID: ${reservationID} to ${updateResult.affectedRows} record(s).`);

      // Redirect to account.html after success
      res.redirect('/account.html');
    });
  });
});

app.post('/update-reservation-status', (req, res) => {
  const input = req.body;
  console.log(input);

    // Normalize input: ensure it's always an array
    const reservations = Array.isArray(input) ? input : [input];

    // Loop through each reservation
    reservations.forEach(reservation => {
        const reservationNum = reservation.reservation_id;
        const reservationStat = reservation.status;

        console.log(`Updating Reservation ID: ${reservationNum} with Status: ${reservationStat}`);

        const query = `
            UPDATE reservation
            SET Reservation_Status = ? 
            WHERE Reservation_ID = ?;
        `;

        // Execute the query for each reservation
        con.query(query, [reservationStat, reservationNum], (err) => {
            if (err) {
                console.error(`Error updating Reservation ID ${reservationNum}:`, err);
            } else {
                console.log(`Successfully updated Reservation ID: ${reservationNum}`);
            }
        });
    });
    // Redirect back to advanced.html
    res.redirect('/advanced.html');
});


/*----------------------------------- REPORTS -----------------------------------*/

// API endpoint for dynamic report generation
app.get("/api/reports", (req, res) => {
  const { reportType } = req.query; // Get reportType from query params

  let query = "";

  // Determine the SQL query to run based on reportType
  switch (reportType) {
    case "1": // Location Frequency Report
      query = `
        SELECT Geo_Location AS Location_Name, COUNT(*) AS Frequency
        FROM Records
        GROUP BY Geo_Location
        ORDER BY Frequency DESC
        LIMIT 10;
      `;
      break;
    case "2": // Government Agency Report
      query = `
        SELECT Creator, Subject, COUNT(Record_ID) AS Record_Count
        FROM Records
        WHERE Subject LIKE '%government%'
           OR Creator LIKE '%agency%'
        GROUP BY Creator, Subject
        ORDER BY Creator, Subject;
      `;
      break;
    case "3": // Distribution Report
      query = `
        SELECT Geo_Location, Language, COUNT(Record_ID) AS Record_Count
        FROM Records
        GROUP BY Geo_Location, Language
        ORDER BY Geo_Location, Language;
      `;
      break;
    case "4": // Monthly Document Report
      query = `
        SELECT Year_Range, COUNT(Record_ID) AS Document_Count
        FROM Records
        WHERE Year_Range BETWEEN '2024-01' AND '2024-12' -- Adjust timeframe as needed
        GROUP BY Year_Range
        ORDER BY Year_Range;
      `;
      break;
    default:
      return res.status(400).send("Invalid report type");
  }

  // Execute the selected query
  con.query(query, (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json(results); // Send JSON response
  });
});


// API endpoint to execute custom SQL
app.get("/api/run-query", (req, res) => {
  const sqlQuery = req.query.sqlCode;

  // Basic validation to prevent dangerous queries
  if (!sqlQuery || sqlQuery.toLowerCase().includes("drop") || sqlQuery.toLowerCase().includes("delete")) {
      return res.status(400).json({ error: "Unsafe SQL query detected!" });
  }

  con.query(sqlQuery, (err, results) => {
      if (err) {
          console.error("SQL Query Error:", err);
          return res.status(500).json({ error: err.message });
      }

      res.json(results);
  });
});

/*----------------------------------- LIBRARIAN VIEW -----------------------------------*/

app.get('/get-submitted-reservations', (req, res) => {// API endpoint to get submitted reservations. i changed this because we want to see all reservations, not just submitted ones
  const query = `
    SELECT Reservation_ID, Reservation_Start_Date, Reservation_Status, Reservation_Fulfilled_Date 
    FROM Reservation;
  `;

  con.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching submitted reservations:', err.message);
      return res.status(500).send('Failed to fetch reservations');
    }
    res.json({ reservations: results }); // Send results as JSON
  });
});

app.post('/modifyRecords', (req, res) => {
  const action = req.body.action || null; // the dropdown
  const Record_ID = req.body.Record_ID || null;
  const Department_Name = req.body.Department_Name || null;
  const Digital_File_Name = req.body.Digital_File_Name || null;
  const Location = req.body.Location || null;
  const Rights = req.body.Rights || null;
  const Title = req.body.Title || null;
  const Alt_Title = req.body.Alt_Title || null;
  const Creator = req.body.Creator || null;
  const Description = req.body.Description || null;
  const Language = req.body.Language || null;
  const Geo_Location = req.body.Geo_Location || null;
  const Year_Range = req.body.Year_Range || null;
  const Containers_Info = req.body.Containers_Info || null;
  const Cabinet = req.body.Cabinet || null;
  const File_Folder = req.body.File_Folder || null;
  const Map_num = req.body.Map_num || null;
  const Reel_Format = req.body.Reel_Format || null;
  const Medium = req.body.Medium || null;
  const Subject = req.body.Subject || null;

  // Handle based on action
  if (action === 'add') { // Logic to add a record
    console.log("Adding new record...");
    const query = `
      INSERT INTO records (Record_ID, Department_Name, Digital_File_Name, Location, Rights, Title, Alt_Title, Creator, Description, Language, Geo_Location, Year_Range, Containers_Info, Cabinet, File_Folder, Map_num, Reel_Format, Medium, Subject) 
      VALUES ('${Record_ID}', '${Department_Name}', '${Digital_File_Name}', '${Location}', '${Rights}', '${Title}', '${Alt_Title}', '${Creator}', '${Description}', '${Language}', '${Geo_Location}', '${Year_Range}', '${Containers_Info}', '${Cabinet}', '${File_Folder}', '${Map_num}', '${Reel_Format}', '${Medium}', '${Subject}');
    `;

    con.query(query, (err) => {
      if (err) {
        console.error('Error adding record:', err.message);
        return res.status(500).send('Failed to add record.'); // Exit here
      }
      console.log("Record added successfully!");
      return res.redirect('/modify.html'); // Send only one response
    });
  } else if (action === 'delete') { // Logic to delete a record
    console.log("Deleting record...");
    const query = `DELETE FROM records WHERE Record_ID = '${Record_ID}';`;

    con.query(query, (err) => {
      if (err) {
        console.error('Error deleting record:', err.message);
        return res.status(500).send('Failed to delete record.'); // Exit here
      }
      console.log("Record deleted successfully!");
      return res.redirect('/modify.html'); // Send only one response
    });
  } else {
    console.log("Unknown action received.");
    return res.status(400).send("Invalid action specified.");
  }
});

/*----------------------------------- Unique ID Generation and Date -----------------------------------*/

const generatedAccountIDs = new Set(); // To ensure unique Account_IDs
function generateUniqueAccountID() {// Function to generate a unique random Account_ID
  let accountID;
  do {
    accountID = `A${Math.floor(100000 + Math.random() * 900000)}`; // e.g., "A123456"
  } while (generatedAccountIDs.has(accountID)); // Ensure it's not a duplicate
  generatedAccountIDs.add(accountID); // Add to the set
  return accountID;
}

const generatedReservationIDs = new Set(); // To ensure unique Account_IDs
function generateUniqueReservationID() {// Function to generate a unique random Reservation_ID
  let reservationID;
  do {
    reservationID = `R${Math.floor(100000 + Math.random() * 900000)}`; // e.g., "R123456"
  } while (generatedReservationIDs.has(reservationID)); // Ensure it's not a duplicate
  generatedReservationIDs.add(reservationID); // Add to the set
  return reservationID;
}

function getCurrentDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/*----------------------------------- ROUTING -----------------------------------*/
app.all('*', function (request, response, next) {// This must be at the end!
  console.log(request.method + ' to ' + request.path);
  next();
});

app.listen(8080, () => console.log(`listening on port 8080`));
