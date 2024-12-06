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

//USER DATA STUFF
let user_reg_data = {};
let user_data_filename = __dirname + '/user_data.json';

app.use(express.static('./public'));
app.use(myParser.urlencoded({ extended: true }));


// monitor all requests and make a reservation
app.all('*', function (request, response, next){// this function also makes reservations
  console.log(request.method + ' to ' + request.path);
     // gives the user a cart if the user does not have one
     if (typeof request.session.reservation == 'undefined'){
       request.session.reservation = {};
    }
  next();
});

if (fs.existsSync(user_data_filename)){// if the user data file exists, read it and parse it
    // get the filesize and print it out
    console.log(`${user_data_filename} has ${fs.statSync(user_data_filename).size} characters.`);
    // let user_reg_data = require('./user_data.json');
    let user_reg_data_JSON = fs.readFileSync(user_data_filename, 'utf-8');
    user_reg_data = JSON.parse(user_reg_data_JSON);
} else {
    console.log(`Error! ${user_data_filename} does not exist!`);
}

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

app.post('/login', function (request, response) {
  let the_username = request.body.username.toLowerCase();
  let the_password = request.body.password;
  // Query
  const query = `
    SELECT User_ID, User_Password 
    FROM users 
    WHERE User_ID = '${the_username}' AND User_Password = '${the_password}';
  `;
  con.query(query, (err) => { // Execute the query
    if (err) {
      console.error('Database error:', err); // Log error for debugging
      return response.redirect('/login.html'); // Redirect to login if there's an error
    }
      return response.redirect('/account.html'); // Redirect to account page
  });
});

const generatedAccountIDs = new Set(); // To ensure unique Account_IDs

// Function to generate a unique random Account_ID
function generateUniqueAccountID() {
  let accountID;
  do {
    accountID = `A${Math.floor(100000 + Math.random() * 900000)}`; // e.g., "A123456"
  } while (generatedAccountIDs.has(accountID)); // Ensure it's not a duplicate
  generatedAccountIDs.add(accountID); // Add to the set
  return accountID;
}

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
      return response.redirect('/account.html');
    });
  });
});

app.get('/logout', function (request, response){// Redirects user to home page after logging out
  response.redirect(`./index.html`)
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

app.post("/requestAndNextPage", (req, res) => {
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

    // Store results in session
    req.session.results = result;

    // Redirect to results.html with updated query parameters
    res.redirect(`/results.html?search=${encodeURIComponent(search)}&page=${page}`);
  });
});


/*----------------------------------- ROUTING -----------------------------------*/
app.all('*', function (request, response, next) {// This must be at the end!
  console.log(request.method + ' to ' + request.path);
  next();
});

app.listen(8080, () => console.log(`listening on port 8080`));
