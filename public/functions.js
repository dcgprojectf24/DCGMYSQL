/*---------- Created by Lui Rabideau, Xin Lin, Tassia Cocoran, Emma Sharp, and Jessica Bandol ----------*/
/* Incorporated into the design from W3schools: W3.CSS 4.15 December 2020 by Jan Egil and Borge Refsnes */
/*------------------------- Lui Rabideau's F2023 ITM352 Assignment 3 Template --------------------------*/
/*-------------------------------------- UHM ITM354 Final Project --------------------------------------*/



/*---------------------------------- GENERAL FUNCTIONS USED EVERWHERE ----------------------------------*/
function faviconInfo(){//contains favicon and css information
    document.write(`
      <link rel="stylesheet" href="./css/home.css">
      <link rel="icon" href="./images/letterR.ico" type="image/x-icon">
      <link rel="shortcut icon" href="./images/letterR.png" type="image/png">
    `)
}
//nav bar - upated by Tassia for styling and adding a logo 
//xin updated logo again and also adjusted order and name
function navBar() {
  let isloggedin = getCookie("loggedIn");
  let nameCookie = getCookie("name");
  let total = getCookie("totalIC");
  if (isloggedin == 1) {
    document.write(`
      <div class="w3-bar w3-white w3-large">
        <div class="w3-bar-item w3-left" style="display: flex; align-items: center;">
          <img src="./images/HAPClogo.png" alt="Logo" style="height: 40px;">
        </div>
        <a href="./index.html" class="w3-bar-item w3-button w3-green w3-mobile">Home</a>
        <a href="./about.html" class="w3-bar-item w3-button w3-mobile">About</a>
        <a href="./search.html" class="w3-bar-item w3-button w3-mobile">Search</a>
        <a href="./reports.html" class="w3-bar-item w3-button w3-mobile">Reports</a>
        <a href="./maps.html" class="w3-bar-item w3-button w3-mobile">Maps</a>
        <a href="./team.html" class="w3-bar-item w3-button w3-mobile">Contact Us</a>
        <a href="./account.html" class="w3-bar-item w3-button w3-right w3-light-grey w3-mobile">Account</a>
        <a href="./logout" class="w3-bar-item w3-button w3-mobile" onclick="logout()">Log Out</a>
      </div>
    `);
  } else {
    document.write(`
      <div class="w3-bar w3-white w3-large">
        <div class="w3-bar-item w3-left" style="display: flex; align-items: center;">
          <img src="./images/HAPClogo.png" alt="Logo" style="height: 30px;">
        </div>
        <a href="./index.html" class="w3-bar-item w3-button w3-green w3-mobile">Home</a>
        <a href="./about.html" class="w3-bar-item w3-button w3-mobile">About</a>
        <a href="./search.html" class="w3-bar-item w3-button w3-mobile">Search</a>
        <a href="./reports.html" class="w3-bar-item w3-button w3-mobile">Reports</a>
        <a href="./maps.html" class="w3-bar-item w3-button w3-mobile">Maps</a>
        <a href="./team.html" class="w3-bar-item w3-button w3-mobile">Contact Us</a>
        <a href="./login.html" class="w3-bar-item w3-button w3-right w3-light-grey w3-mobile">Login</a>
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

/*------------------------- INVOICE AND SHOPPING CART PAGE SPECIFIC FUNCTIONS --------------------------*/

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
