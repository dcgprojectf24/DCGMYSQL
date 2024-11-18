var express = require('express');
var app = express();
var myParser = require("body-parser");
var mysql = require('mysql');

// Connects to Database
console.log("Connecting to localhost..."); 
var con = mysql.createConnection({
  host: '127.0.0.1',
  user: "root",
  port: 3306,
  database: "Travel",
  password: ""
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

app.use(express.static('./public'));
app.use(myParser.urlencoded({ extended: true }));

/*---------------------------------- FUNCTIONS ----------------------------------*/
function isNonNegInt(stringToCheck, returnErrors = false) {
  errors = []; // assume no errors at first
  if (Number(stringToCheck) != stringToCheck) errors.push('Not a number!'); // Check if string is a number value
  if (stringToCheck < 0) errors.push('Negative value!'); // Check if it is non-negative
  if (parseInt(stringToCheck) != stringToCheck) errors.push('Not an integer!'); // Check that it is an integer

  return returnErrors ? errors : (errors.length == 0);
}


/*---------------------------------- SQL START ----------------------------------*/
function query_DB(POST, response) {
  if (isNonNegInt(POST['low_price'])
    && isNonNegInt(POST['high_price'])) {   // Only query if we got a low and high price
    low = POST['low_price'];      // Grab the parameters from the submitted form
    high = POST['high_price'];
    query = "SELECT * FROM Room where price > " + low + " and price < " + high;  // Build the query string
    con.query(query, function (err, result, fields) {   // Run the query
      if (err) throw err;
      console.log(result);
      var res_string = JSON.stringify(result);
      var res_json = JSON.parse(res_string);
      console.log(res_json);

      // Now build the response: table of results and form to do another query
      response_form = `<form action="Room-query.html" method="GET">`;
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
  } else {
    response.send("Enter some prices doofus!");
  }
}


app.post("/process_query", function (request, response) {
  let POST = request.body;
  query_DB(POST, response);
});

/*---------------------------------- LOGIN/REGISTER ----------------------------------*/
app.post('/login', function (request, response){// Validates a users login, and redirects page to the page if invalid and to cart if valid
  // Process login form POST and redirect to logged in page if ok, back to login page if not
  let the_username = request.body.username.toLowerCase();
  let the_password = request.body.password;
  if(typeof user_reg_data[the_username] !== 'undefined'){// check if username is in user_data
     if(user_reg_data[the_username].password === the_password){// check if the password matches the password in user_reg_data
        console.log(`${the_username} is logged in!`);
        response.cookie("username", the_username, {expire: Date.now() + 30 * 60 * 1000});// send a username cookie to indicate logged in
        response.cookie("name", user_reg_data[the_username].name, {expire: Date.now() + 30 * 60 * 1000});// make a name cookie
        response.cookie("loggedIn", 1, {expire: Date.now() + 30 * 60 * 1000});// make a logged in cookie
        userLoggedin[the_username] = true;
        let cartCookie = Number(request.body.total);
        if(cartCookie == 0) {
          response.redirect(`./index.html`)
        } else {
          response.redirect(`./shoppingCart.html`);
        }
     } else {
        response.redirect(`./login.html?error=pass`)
     }
  } else { // else the user does not exist 
     response.redirect(`./login.html?error=user`);
  }
});

app.post('/register', function (request, response){// Makes a new user while validating that info, then sends the new user to the shopping cart
  let username = request.body.username.toLowerCase();
  user_reg_data[username] = {};
  user_reg_data[username].password = request.body.password;
  user_reg_data[username].username = request.body.username;  
  user_reg_data[username].name = request.body.firstname + ' ' + request.body.lastname;
  // add it to the user_data.json
  fs.writeFileSync(user_data_filename, JSON.stringify(user_reg_data));
  if(typeof user_reg_data[username] !== 'undefined' && typeof user_reg_data[username].password !== 'undefined' && typeof user_reg_data[username].username !== 'undefined'){
     // add new logged in user, place above the redirect
     userLoggedin[username] = true; 
     response.cookie("username", username, {expire: Date.now() + 30 * 60 * 1000});// send a username cookie to indicate logged in
     response.cookie("name", user_reg_data[username].name, {expire: Date.now() + 30 * 60 * 1000});// make a name cookie
     response.cookie("loggedIn", 1, {expire: Date.now() + 30 * 60 * 1000});// make a logged in cookie
     let cartCookie = Number(request.body.total);
        if(cartCookie == 0) {
          response.redirect(`./index.html`)
        } else {
          response.redirect(`./shoppingCart.html`);
        }  
  } else {
     response.redirect(`./register.html`)
  }
});  

/*----------------------------------- ROUTING -----------------------------------*/
app.all('*', function (request, response, next) {
  console.log(request.method + ' to ' + request.path);
  next();
});

app.listen(8080, () => console.log(`listening on port 8080`));
