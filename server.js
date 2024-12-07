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

/*---------------------------------- FUNCTIONS ----------------------------------*/
function isNonNegInt(stringToCheck, returnErrors = false) {
  errors = []; // assume no errors at first
  if (Number(stringToCheck) != stringToCheck) errors.push('Not a number!'); // Check if string is a number value
  if (stringToCheck < 0) errors.push('Negative value!'); // Check if it is non-negative
  if (parseInt(stringToCheck) != stringToCheck) errors.push('Not an integer!'); // Check that it is an integer

  return returnErrors ? errors : (errors.length == 0);
}

/*---------------------------------- KAZMAN SQL ----------------------------------*/
function query_DB(POST, response) {
  if (isNonNegInt(POST['low_price']) && isNonNegInt(POST['high_price'])) {// Only query if we got a low and high price
    low = POST['low_price']; // Grab the parameters from the submitted form
    high = POST['high_price'];
    /*---------------------------------- QUERY ----------------------------------*/
    query = "SELECT * FROM Room where price > " + low + " and price < " + high; // Build the query string
    con.query(query, function (err, result, fields) {   // Run the query
      if (err) throw err;
      console.log(result);
      var res_string = JSON.stringify(result);
      var res_json = JSON.parse(res_string);
      console.log(res_json);
    /*---------------------------------- QUERY ----------------------------------*/
    /*---------------------------------- DISPLAY ----------------------------------*/
      // Now build the response: table of results and form to do another query
      response_form = `<form action="homeSQL.html" method="GET">`;
      response_form += `<table border="3" cellpadding="5" cellspacing="5">`;
      response_form += `<td><B>Room#</td><td><B>Hotel#</td><td><B>Type</td><td><B>Price</td></b>`;
      for (i in res_json) {
        response_form += `<tr><td> ${res_json[i].roomNo}</td>`;
        response_form += `<td> ${res_json[i].hotelNo}</td>`;
        response_form += `<td> ${res_json[i].type}</td>`;
        response_form += `<td> ${res_json[i].price}</td></tr>`;
      }
      response_form += "</table>";
      response_form += `<input type="submit" value="Another Query?"> </form>`;
      response.send(response_form);
    });
    /*---------------------------------- DISPLAY ----------------------------------*/
  } else { // If any errors occur
    response.send("Enter some prices doofus!");
  }
}

app.post("/process_query", function (request, response) {
  let POST = request.body;
  query_DB(POST, response);
});

/*---------------------------------- LOGIN/LOGOUT/REGISTER ----------------------------------*/

app.post('/login', (request, response) => {// Login route
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

    // Password validation (replace with bcrypt.compare for hashed passwords)
    if (user.User_Password !== the_password) {
      return response.status(401).send('Invalid username or password');
    }

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
        return response.status(500).send('Internal Server Error');
      }

      if (accountResults.length > 0) {
        const accountID = accountResults[0].Account_ID;

        // Store Account_ID in the session
        request.session.Account_ID = accountID;

        console.log(`Account_ID ${accountID} stored in session.`);

        // Redirect to account page
        response.cookie("loggedIn", 1, {expire: Date.now() + 30 * 60 * 1000});// make a logged in cookie
        response.redirect('/account.html');
      } else {
        response.status(404).send('Account not found.');
      }
    });
  });
});

app.post('/register', function (request, response) { // Makes a new user
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
    ('${accountID}', '${the_username}', '${fullname}');
  `;

  // Query to insert data into the `users` table
  const query1 = `
    INSERT INTO users (User_ID, User_Password, Account_ID) VALUES
    ('${the_username}', '${the_password}', '${accountID}');
  `;

  // Execute the first query
  con.query(query, (err) => {
    if (err) {
      console.error('Database error in account table:', err); // Log error for debugging
      return response.redirect('/register.html'); // Redirect to register if there's an error
    }

    // Execute the second query only if the first one is successful
    con.query(query1, (err) => {
      if (err) {
        console.error('Database error in users table:', err); // Log error for debugging
        return response.redirect('/register.html'); // Redirect to register if there's an error
      }

      // Redirect to account page if both queries are successful
      response.cookie("loggedIn", 1, {expire: Date.now() + 30 * 60 * 1000});// make a logged in cookie
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

//app.use(session({// Configure the session middleware
//  secret: 'your_secret_key', // Replace with a secure key
//  resave: false,
//  saveUninitialized: true,
//  cookie: { secure: false } // Set to true if using HTTPS
//}));

app.get("/geo", (req, res) => {
  const search = req.query.search; // Use 'search' for query parameter
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page
  const offset = (page - 1) * limit;

  if (!search) {
      return res.status(400).send("Search term is required.");
  }

  const query = `
      SELECT Record_ID, Title, Department_Name, Year_Range, Subject, Description, Medium, Language 
      FROM RECORDS 
      WHERE Geo_Location LIKE '%${search}%'
      LIMIT ${limit} OFFSET ${offset};
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
      res.json({ Account_ID: req.session.Account_ID });
  } else {
      res.status(401).json({ error: "Account number not found in session." });
  }
});

/*---------------------------------- SEARCH SQL ----------------------------------*/
app.post("/executeSearch", (req, res) => {
  const search = req.body.searchInput;
  const type = req.body.searchType;
  const format = req.body.format;

  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 records per page
  const offset = (page - 1) * limit;

  console.log(format);

  const query = `
    SELECT Record_ID, Title, Department_Name, Year_Range, Subject, Description, Medium, Language 
    FROM RECORDS WHERE ${type} LIKE '%${search}%' AND Medium = '${format}' 
    LIMIT ${limit} OFFSET ${offset};
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
    res.redirect(`/results.html?search=${encodeURIComponent(search)}&page=${page}`);
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

app.get('/get-empty-reservations', (req, res) => {// API endpoint to fetch records with Reservation_ID empty
  const query = `
    SELECT Record_ID, Title, Department_Name, Year_Range, Subject, Description, Medium, Language
    FROM records
    WHERE Record_ID IN (SELECT Record_ID
                        FROM contains
                        WHERE Reservation_ID IS NULL OR Reservation_ID = '');
  `;

  con.query(query, (err, results) => {
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

/*----------------------------------- LIBRARIAN VIEW -----------------------------------*/

app.get('/get-submitted-reservations', (req, res) => {// API endpoint to get submitted reservations
  const query = `
    SELECT Reservation_ID, Account_ID, Reservation_Start_Date, Reservation_Status, Reservation_Fulfilled_Date 
    FROM Reservation 
    WHERE Reservation_Status = 'Submitted';
  `;

  con.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching submitted reservations:', err.message);
      return res.status(500).send('Failed to fetch reservations');
    }
    res.json({ reservations: results }); // Send results as JSON
  });
});

app.post('/modifyRecords', (req, res) => {// API endpoint to modify records data
  const action = req.body.action; // Access the dropdown value
  const Record_ID = req.body.Record_ID;
  const Department_Name = req.body.Department_Name;
  const Digital_File_Name = req.body.Digital_File_Name;
  const Location = req.body.Location;
  const Rights = req.body.Rights;
  const Title = req.body.Title;
  const Alt_Title = req.body.Alt_Title;
  const Creator = req.body.Creator;
  const Description = req.body.Description;
  const Language = req.body.Language;
  const Geo_Location = req.body.Geo_Location;
  const Year_Range = req.body.Year_Range;
  const Containers_Info = req.body.Containers_Info;
  const Cabinet = req.body.Cabinet;
  const File_Folder = req.body.File_Folder;
  const Map_num = req.body.Map_num;
  const Reel_Format = req.body.Reel_Format;
  const Medium = req.body.Medium;
  const Subject = req.body.Subject;
  let query; //define query 
  // Handle based on action
  if (action === 'add') { // Logic to add a record
    console.log("Adding new record...");
    query = `
      INSERT INTO your_table_name (
        Record_ID, Department_Name, Digital_File_Name, Location, Rights, Title, 
        Alt_Title, Creator, Description, Language, Geo_Location, Year_Range, 
        Containers_Info, Cabinet, File_Folder, Map_num, Reel_Format, Medium, Subject
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
        Record_ID, Department_Name, Digital_File_Name, Location, Rights, Title, 
        Alt_Title, Creator, Description, Language, Geo_Location, Year_Range, 
        Containers_Info, Cabinet, File_Folder, Map_num, Reel_Format, Medium, Subject
    ];

    con.query(query, values, (err, results) => {
        if (err) {
            console.error('Error adding record:', err.message);
            return res.status(500).send('Failed to add record.');
        }
        console.log("Record added successfully!");
        res.redirect('/modify.html'); // Send response only here on success
    });
  } else if (action === 'modify') {// Logic to modify a record
    console.log("Modifying existing record..."); 
    query = `
      SELECT Reservation_ID, Account_ID, Reservation_Start_Date, Reservation_Status, Reservation_Fulfilled_Date 
      FROM Reservation 
      WHERE Reservation_Status = 'Submitted';
    `;
  } else if (action === 'delete') {// Logic to delete a record
    console.log("Deleting record...");
    query = `
      SELECT Reservation_ID, Account_ID, Reservation_Start_Date, Reservation_Status, Reservation_Fulfilled_Date 
      FROM Reservation 
      WHERE Reservation_Status = 'Submitted';
    `;
  } else {
    console.log("Unknown action received.");
    res.status(400).send("Invalid action specified.");
    return;
  }
  // Redirect to account.html after success
  res.redirect('/modify.html');
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
