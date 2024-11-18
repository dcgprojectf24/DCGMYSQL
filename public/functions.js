/*----------------------------- Created by Lui Rabideau, due on 12/15/2023 -----------------------------*/
/* Incorporated into the design from W3schools: W3.CSS 4.15 December 2020 by Jan Egil and Borge Refsnes */
/*--------------------------------------- UHM ITM352 Assignment 3 --------------------------------------*/

/*---------------------------------- GENERAL FUNCTIONS USED EVERWHERE ----------------------------------*/
function faviconInfo(){//contains favicon and css information
    document.write(`
      <link rel="stylesheet" href="./css/home.css">
      <link rel="icon" href="./images/letterR.ico" type="image/x-icon">
      <link rel="shortcut icon" href="./images/letterR.png" type="image/png">
    `)
}

function navBar(){// Makes a navbar
  let isloggedin = getCookie("loggedIn");
  let nameCookie = getCookie("name");
  let total = getCookie("totalIC");
  if(isloggedin == 1){
    document.write(`
    <div class="w3-top">
    <div class="w3-bar w3-white w3-wide w3-padding w3-card">
     <a href="./index.html" class="w3-bar-item w3-button"><b>Ryer</b> Architects</a>
     <!-- Float links to the right. Hide them on small screens -->
     <div class="w3-right w3-hide-small">
       <a href="./products.html?location=NewYork" class="w3-bar-item w3-button">New York</a>
       <a href="./products.html?location=SanFran" class="w3-bar-item w3-button">San Francisco</a>
       <a href="./products.html?location=Chicago" class="w3-bar-item w3-button">Chicago</a>
       <a href="./team.html" class="w3-bar-item w3-button">Our Team</a>
       <a href="./logout" class="w3-bar-item w3-button" onclick="logout()">Log Out</a>
       <a href="./shoppingCart.html" class="w3-bar-item w3-button">${nameCookie}'s Cart: (${total}) items</a>
     </div>
    </div>
   </div>
   `);
  } else {
    document.write(`
    <div class="w3-top">
    <div class="w3-bar w3-white w3-wide w3-padding w3-card">
     <a href="./index.html" class="w3-bar-item w3-button"><b>Ryer</b> Architects</a>
     <!-- Float links to the right. Hide them on small screens -->
     <div class="w3-right w3-hide-small">
       <a href="./products.html?location=NewYork" class="w3-bar-item w3-button">New York</a>
       <a href="./products.html?location=SanFran" class="w3-bar-item w3-button">San Francisco</a>
       <a href="./products.html?location=Chicago" class="w3-bar-item w3-button">Chicago</a>
       <a href="./team.html" class="w3-bar-item w3-button">Our Team</a>
       <a href="./login.html" class="w3-bar-item w3-button">Login</a>
     </div>
    </div>
   </div>
   `);
  }
}

// from ChatGPT, modified by Lui Rabideau under prompt "function that gets current date"
function getCurrentDate() {// Function to get the current date in the format YYYY-MM-DD
    // Function from ChatGPT using the "make me a function that gets todays date using javascript" prompt
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// from ChatGPT, modified by Lui Rabideau under prompt "recommend password function in textbox javascript and html"
function generateRandomPassword(length){// Generate password function 
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?/{}[]";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset.charAt(randomIndex);
    }
    return password;
}

function generatePassword(){// Used in conjunction with the function above. This function is called at the click of a button and it takes the value of the generatePassword function and returns it to a specificied elementID
  const passwordField = document.getElementById("password");
  const generatedPassword = generateRandomPassword(10); // Change the length as needed
  passwordField.value = generatedPassword;
}

function logout() {// deletes the logged in cookie and reloads the page
  // Deletes all cookies
  document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "loggedIn=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "totalIC=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie =  "address=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // Reload the current page
  location.reload();
}

// This function asks the server for a "service" and converts the response to text. 
function loadJSON(service, callback) {   
  let xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open('POST', service, false);
  xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
          // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
          callback(xobj.responseText);
        }
  };
  xobj.send(null);  
}

// from ChatGPT, modified by Lui Rabideau under prompt "function to reload the page every second for 5 seconds"
function reloadPageFor1Seconds() {
  let seconds = 0;
  const reloadInterval = setInterval(function () {
      if (seconds < 1) {
          location.reload();
          seconds++;
      } else {
          clearInterval(reloadInterval);
      }
  }, 1000); // 1000 milliseconds = 1 second
}

/*---------------------------------- PRODUCTS PAGE SPECIFIC FUNCTIONS ----------------------------------*/
function productsTable(){// Function that generates the products on the products.html page
    for (let i in products){
      let a_qty = shopping_cart[prod_key][`quantity${i}`];
      let fav = shopping_cart[prod_key][`favorite${i}`];
        document.write(`   
            <div class="product-item">
                <img class="product-image" src="${products[i].image}">
                <div class="product-title">${products[i].brand}</div>
                <div class="product-description">${products[i].description}</div>
                <span class="product-price">$${products[i].price}</span>
                <lable>Favorite:</lable><input type="checkbox" id="checkbox${prod_key}_${i}" name="favorite${i}" onchange="updateFav('${prod_key}',${i});"> 
                <div class="product-avaliability">Product Avaliability: ${products[i].aval}</div>
                <label id="quantity${i}_label"}">Quantity:</label>
                <div style="color: blue;" id="active_error${i}"></div>
                <input type="number" id="textbox${prod_key}_${i}" name="quantity${i}" onchange="updateQuantity('${prod_key}',${i});" value="${a_qty}" min="0">
                <span id="quantity${i}_cart_label"}">In cart: ${a_qty}</span> 
               <div style="color: red;" id="error_message${i}"></div>
            </div>
        `); 
        if(fav == "on"){
          document.getElementById(`checkbox${prod_key}_${i}`).checked = true;
        } else {
          document.getElementById(`checkbox${prod_key}_${i}`).checked = false;
        }  
    };
} 

function productsPageErrors(){// Interprets the errors from the query string and displays them
    // the following only occurs when the page is loaded (as opposed to the function after this which executes 10 times a sec)
    window.onload=function(){
    // intepretting the information given to us by the server
    let params = (new URL(document.location)).searchParams;
    // if the query string has Input, print the error and change the button
    if ((params.get(`error`)) === `NoInput`) { 
      document.getElementById(`leButton`).innerHTML = "No input: select some items to purchase";
    } else {
     for (let i in products) {
      // if the query string has an error values in it, print the error under the input box and then change the button accordingly
      if (params.has(`error_quantity${i}`)) {
        document.getElementById(`error_message${i}`).innerHTML = params.get(`error_quantity${i}`);
        if (params.get(`error_quantity${i}`)===`Not a number!`) { 
        document.getElementById(`leButton`).innerHTML = "Not a number: input a number";
        } else if (params.get(`error_quantity${i}`)===`Negative value!`) { 
        document.getElementById(`leButton`).innerHTML = "Negative value: input a positive value";
        } else if (params.get(`error_quantity${i}`)===`Not an integer!`) { 
        document.getElementById(`leButton`).innerHTML = "Not an integer: input a whole number";
        } else { 
        document.getElementById(`leButton`).innerHTML = "Unavaliable quantity";
        };
      };
     }; 
    }; 
    };
  // calls the checkTextBox function every 1/10 of a second (found in functions)
  // discovered this existed in October from W3 schools ( https://www.w3schools.com/jsref/met_win_setinterval.asp )
  setInterval(checkTextBox, 100);
}

function loginError(){ //shows the login errors
  let params = (new URL(document.location)).searchParams; //gets the query string for errors
  console.log(`yes`);
  if (params.get(`error`)=== `user`) {
    console.log(`yes1`);
    document.getElementById(`error_message`).innerHTML = 'User does not exist!';
    };
  if (params.get(`error`)=== `pass`) { 
    console.log(`yes2`);
    document.getElementById(`error_message`).innerHTML = "Invalid Password";
    };
}

function checkTextBox(){// Used in products.html to display the active errors in the textboxes
    for(let i in products){// the loop is necessary so that all textboxes dont show the same thing
      // getting the value from the textbox
      let textBoxValue = document.getElementById(`textbox${prod_key}_${i}`).value;
      // if the textboxvalue is 0 or nothing, return empty '', else if return whatever the error is, else return a "you want--"
      if(textBoxValue === '' || textBoxValue == 0 || textBoxValue == null){
        document.getElementById(`active_error${i}`).innerHTML = "";
      } else if (Number(textBoxValue) != textBoxValue){
        document.getElementById(`active_error${i}`).innerHTML = "Active Error: Not a number!";
      } else if (textBoxValue < 0) {
        document.getElementById(`active_error${i}`).innerHTML = "Active Error: Negative value!";
      } else if (parseInt(textBoxValue) != textBoxValue) {
        document.getElementById(`active_error${i}`).innerHTML = "Active Error: Not an integer!";
      } else if (Number(textBoxValue) > 0) {
        document.getElementById(`active_error${i}`).innerHTML = `You want: ${textBoxValue}`;
      }
    };
}

/*------------------------- INVOICE AND SHOPPING CART PAGE SPECIFIC FUNCTIONS --------------------------*/

function generateInvoiceTable(){// The generate item rows function in INVOICE_HTML
    // form was submitted so process the invoice
  for (let prod_key in shopping_cart) {
    let products = all_products[prod_key];
    for (let i in products) {
      let a_qty = shopping_cart[prod_key][`quantity${i}`];
    //creates item rows
        extended_price = a_qty * products[i].price;
        subtotal += extended_price;
        //checks for quantities = 0
        if(a_qty == 0){
          continue;
        }else{
          document.write(`
            <tr style="height: 100px;">
              <td><div class="image-container"><img src="${products[i].image}" style="width: 100%; height: 100%;">              
              <div class="popup">${products[i].description}</div></div>
              </td>
              <td>${products[i].brand}</td>
              <td>${a_qty}</td>
              <td>$${products[i].price.toFixed(2)}</td>
              <td>$${extended_price.toFixed(2)}</td>
            </tr>`);
        }
      }    
        // Subtotal calculation takes place after every loop
        
    };
};

function generateCartTable(){// The generate item rows function in SHOPPINGCART_HTML0
  for (let prod_key in shopping_cart) {
    let products = all_products[prod_key];
    for (let i in products) {
      let a_qty = shopping_cart[prod_key][`quantity${i}`];
    //creates item rows
      extended_price = a_qty * products[i].price;
      subtotal += extended_price;
        if(a_qty == 0){//checks for quantities = 0
          continue;
        }else{
        let fav = shopping_cart[prod_key][`favorite${i}`];
        // the div class id="pop up" is IR5
          document.write(`
            <tr style="height: 100px;">
              <td><div class="image-container"><img src="${products[i].image}" style="width: 100%; height: 100%;">              
              <div class="popup">${products[i].description}</div></div>
              </td>
              <td><input type="checkbox" id="checkbox${prod_key}_${i}" name="favorite${i}" onchange="updateFav('${prod_key}',${i});"></td>
              <td>${products[i].brand}</td>
              <td><label>Edit:</label><input type="number" id="quantityTextbox${prod_key}_${i}" onchange="updateQuantity('${prod_key}',${i});" value="${a_qty}"></td>
              <td>$${products[i].price.toFixed(2)}</td>
              <td>$${extended_price.toFixed(2)}</td>
            </tr>`);
            if(fav == "on"){
              document.getElementById(`checkbox${prod_key}_${i}`).checked = true;
            } else {
              document.getElementById(`checkbox${prod_key}_${i}`).checked = false;
            }  
        }
    }  
  };
};

function updateQuantity(location, productIndex){
  // get the shopping cart data for this user
  loadJSON(`update_cart?location=${location}&productIndex=${productIndex}&value=${document.getElementById(`quantityTextbox${location}_${productIndex}`).value}`, function (response) {
  // Parsing JSON string into object
  shopping_cart = JSON.parse(response);
  reloadPageFor1Seconds();
});
}

function updateFav(location, productIndex){
  console.log(location, productIndex, document.getElementById(`checkbox${location}_${productIndex}`).value);
  // get the shopping cart data for this user
  loadJSON(`update_fav?location=${location}&productIndex=${productIndex}&value=${document.getElementById(`checkbox${location}_${productIndex}`).value}`, function (response) {
  // Parsing JSON string into object
  shopping_cart = JSON.parse(response);
});
}

/*---------------------------------------- TEAM PAGE FUNCTION ------------------------------------------*/
function teamTable(){// Function that generates the professionals information on the our team/about page
    for (let i in professionals) {
        document.write(`    
          <div class="w3-col l3 m6 w3-margin-bottom">
          <img src="${professionals[i].pfp}" style="width:100%">
          <h3>${professionals[i].name}</h3>
          <p class="w3-opacity">${professionals[i].position}</p>
          <p>${professionals[i].summary}</p>
          </div>
        `)
    };
}

/*----------------------------------------- COOKIE FUNCTIONs -------------------------------------------*/

// from ChatGPT, modified by Lui Rabideau under prompt "make me a function that makes cookies that last for 30 minutes"
function setCookie(name, value, minutesToExpire) {// Function to set a cookie with a specified expiration time
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + (minutesToExpire * 60 * 1000));
  const cookieString = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/`;
  document.cookie = cookieString;
}

// from ChatGPT, modified by Lui Rabideau under prompt "function to get the value of cookie"
function getCookie(name){// Function to get the value of a cookie by name
    let cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.indexOf(name + "=") === 0) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}

// from ChatGPT, modified by Lui Rabideau under prompt "function to check if cookie exists"
function checkCookie(cookieName) {// Function to check if a cookie exists
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName + "=") === 0) {
          return true; // Cookie found
      }
  }
  return false; // Cookie not found
}

/*------------------------------------------------------------------------------------------------------*/