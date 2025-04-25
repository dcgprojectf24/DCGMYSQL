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
  database: "rhw", 
  password: ""
}); 

con.connect(function (err) {// Throws error or confirms connection
  if (err) throw err;
 console.log("Connected!");
});

/*---------------------------------- LOGIN/LOGOUT/REGISTER ----------------------------------*/

app.post('/loginGuest', (request, response) => {
  const the_username = request.body.username.toLowerCase();
  const the_password = request.body.password;

  // Define query to validate user credentials
  const query = `
    SELECT g.Email, g.Password 
    FROM guest g
    WHERE g.Email = ?;
  `;

  con.query(query, [the_username], (err, results) => {
    console.log(`${results[0]}`);

    if (err) {
      console.error('Database error:', err);
      return response.status(500).send('Internal Server Error');
    }

    // Check if email exists
    if (results.length === 0) {
      return response.status(401).send('Invalid username or password');
    }

    const user = results[0];

    // Check if password exists
    if (user.Password !== the_password) {
      return response.status(401).send('Invalid username or password');
    }

    // Store User_ID and User_Name in session
//    request.session.Account_Name = user.User_Name; // User_Name
//    request.session.Account_ID = user.User_ID;     // User_ID

//    console.log(`User_Name ${user.User_Name} stored in session.`);
//    console.log(`User_ID ${user.User_ID} stored in session.`);

    // Set logged-in cookie and redirect
    response.cookie("loggedIn", 1, { expire: Date.now() + 30 * 60 * 1000 }); // 30 min cookie THAT RECORDS WHEN YOU LOG IN
    return response.redirect('/rooms.html');
  });
});

app.post('/register', function (request, response) { 
  let the_username = request.body.username.toLowerCase(); // Account_Email
  let the_password = request.body.password;              // Account_Password
  let lname = request.body.lastname;                     // Last name
  let fname = request.body.firstname;                    // First name
  let fullname = fname + ' ' + lname;                    // User_Name

  // Query to insert data into the `account` table
  const queryAccount = `
    INSERT INTO account (Account_Email, Account_Password) 
    VALUES (?, ?);
  `;

  // Query to insert data into the `user` table
  const queryUser = `
    INSERT INTO user (User_ID, User_Name, Account_Email) 
    VALUES (?, ?, ?);
  `;

  // Generate a unique User_ID
  let userID = generateUniqueUserID();

  // Insert into the `account` table
  con.query(queryAccount, [the_username, the_password], (err) => {
    if (err) {
      console.error('Database error in account table:', err); 
      return response.status(500).send('Error creating account.');
    }

    // Insert into the `user` table
    con.query(queryUser, [userID, fullname, the_username], (err) => {
      if (err) {
        console.error('Database error in user table:', err);
        return response.status(500).send('Error creating user.');
      }
      // Store Account_ID and Name in the session
      request.session.Name = fullname;
      request.session.Account_ID = userID;

      console.log(`User created successfully with User_ID: ${userID}`);

      // Set logged-in cookie and redirect
      response.cookie("loggedIn", 1, { expire: Date.now() + 30 * 60 * 1000 });
      return response.redirect('/account.html');
    });
  });
});

app.get('/logout', function (request, response){// Redirects user to home page after logging out
  response.redirect(`./index.html`)
});

app.post('/loginStaff', (request, response) => {// Login route
  const the_username = request.body.username.toLowerCase();
  const the_password = request.body.password;

  // Secure query to validate user credentials
  const query = `
    SELECT s.Email, s.Password, s.Role
    FROM staff s
    WHERE s.Email = ?;
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
    if (user.Password !== the_password) {
      return response.status(401).send('Invalid username or password');
    }
  
    // Store User_ID and User_Name in session
    //request.session.Account_Name = user.User_Name; // User_Name
    //request.session.Account_ID = user.User_ID;     // User_ID

    //console.log(`User_Name ${user.User_Name} stored in session.`);
    //console.log(`User_ID ${user.User_ID} stored in session.`);

    // Set logged-in cookie and redirect
    response.cookie("loggedIn", 1, { expire: Date.now() + 30 * 60 * 1000 }); // 30 min cookie THAT RECORDS WHEN YOU LOG IN
    
    if(user.Role === 'Manager'){ // CHANGES THE VALE OF THE STAFF COOKIE ACCORDING TO THE ROLE OF THE STAFF MEMBER
      response.cookie("staff", 2, {expire: Date.now() + 30 * 60 * 1000});// make a manager cookie
    }else{
      response.cookie("staff", 1, {expire: Date.now() + 30 * 60 * 1000});// make a staff cookie
    }
    
    return response.redirect('/rooms.html');
  });
});

/*---------------------------------- ROOMS SQL ----------------------------------*/

app.get("/searchRooms", (req, res) => {
  const start = request.body.in;
  const end = request.body.out;
  const room = request.body.room;
  const persons = request.body.persons;

  if (!search) {
      return res.status(400).send("Search term is required.");
  }

  const query = `
      SELECT * 
      FROM rooms 
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
    SELECT r.Record_ID, r.Title, d.D_name, r.Date, r.Subject, r.Description, r.Medium, r.Language, res.Reservation_Status 
    FROM record r
    JOIN department d ON r.Department_ID = d.Department_ID
    JOIN reserves res ON r.Record_ID = res.Record_ID
    WHERE res.User_ID = '${accountId}';
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
    const userID = reservation.user_id;          // Updated to User_ID
    const recordID = reservation.record_id;      // Updated to Record_ID
    const reservationStat = reservation.status;  // Updated to Reservation_Status

    console.log(`Updating User_ID: ${userID}, Record_ID: ${recordID} with Status: ${reservationStat}`);

    const query = `
        UPDATE reserves
        SET Reservation_Status = ?
        WHERE User_ID = ? AND Record_ID = ?;
    `;

    // Execute the query for each reservation
    con.query(query, [reservationStat, userID, recordID], (err) => {
      if (err) {
        console.error(`Error updating User_ID ${userID}, Record_ID ${recordID}:`, err);
      } else {
        console.log(`Successfully updated User_ID: ${userID}, Record_ID: ${recordID}`);
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
SELECT Location, COUNT(*) AS Record_Count
FROM record
GROUP BY Location
ORDER BY Record_Count DESC;
      `;
      break;
    case "2": // Government Agency Report
      query = `
SELECT d.D_name AS Department_Name, r.Title AS Record_Title, r.Subject
FROM record r
JOIN department d ON r.Department_ID = d.Department_ID
WHERE d.D_name LIKE '%Department%'
ORDER BY d.D_name, r.Title;

      `;
      break;
    case "3": // Distribution Report
      query = `
SELECT Medium, COUNT(*) AS Record_Count
FROM record
GROUP BY Medium
ORDER BY Record_Count DESC;
      `;
      break;
    case "4": // Monthly Document Report
      query = `
SELECT Record_ID, Title, Date, Subject, Medium
FROM record
WHERE Date LIKE '2024-01%' 
ORDER BY Date ASC;
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

/*----------------------------------- STAFF VIEW -----------------------------------*/

app.get('/get-submitted-reservations', (req, res) => {// API endpoint to get submitted reservations. i changed this because we want to see all reservations, not just submitted ones
  const query = `
    SELECT User_ID, Record_ID, Librarian_ID, Reservation_Start_Date, Reservation_Status, Returned_Time 
    FROM reserves;
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
  const Author_ID = req.body.Author_ID || null;
  const Publisher_ID = req.body.Publisher_ID || null;
  const Department_ID = req.body.Department_ID || null;
  const ISBN = req.body.ISBN || null;
  const Location = req.body.Location || null;
  const Rights = req.body.Rights || null;
  const Title = req.body.Title || null;
  const Description = req.body.Description || null;
  const Language = req.body.Language || null;
  const Geo_Location = req.body.Geo_Location || null;
  const Date = req.body.Date || null;
  const Metadata = req.body.Metadata || null;
  const Medium = req.body.Medium || null;
  const Subject = req.body.Subject || null;

  // Handle based on action
  if (action === 'add') { // Logic to add a record
    console.log("Adding new record...");
    const query = `
      INSERT INTO record (Record_ID, Author_ID, Publisher_ID, Department_ID, ISBN, Location, Rights, Title, Description, Language, Geo_Location, Date, Metadata, Medium, Subject) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    con.query(
      query,
      [
        Record_ID, Author_ID, Publisher_ID, Department_ID, ISBN, Location, Rights, 
        Title, Description, Language, Geo_Location, Date, Metadata, Medium, Subject
      ],
      (err) => {
        if (err) {
          console.error('Error adding record:', err.message);
          return res.status(500).send('Failed to add record.');
        }
        console.log("Record added successfully!");
        return res.redirect('/modify.html');
      }
    );
  } else if (action === 'delete') { // Logic to delete a record
    console.log("Deleting record...");
    const query = `DELETE FROM record WHERE Record_ID = ?;`;

    con.query(query, [Record_ID], (err) => {
      if (err) {
        console.error('Error deleting record:', err.message);
        return res.status(500).send('Failed to delete record.');
      }
      console.log("Record deleted successfully!");
      return res.redirect('/modify.html');
    });
  } else {
    console.log("Unknown action received.");
    return res.status(400).send("Invalid action specified.");
  }
});

/*----------------------------------- Unique ID Generation and Date -----------------------------------*/

const generatedAccountIDs = new Set(); // To ensure unique Account_IDs
function generateUniqueUserID() {// Function to generate a unique random Account_ID
  let accountID;
  do {
    accountID = `U${Math.floor(100000 + Math.random() * 900000)}`; // e.g., "A123456"
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
