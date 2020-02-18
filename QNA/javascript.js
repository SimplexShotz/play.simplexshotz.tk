
// AJAX Setup:
function getAjax(url, success) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState > 3 && xhr.status === 200) success(xhr.responseText);
  };
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.send();
  return xhr;
}
function request(query, callback) {
  getAjax("https://cors-anywhere.herokuapp.com/https://reconnect.simplexshotz.repl.co/?" + query, callback);
}
// Firebase Setup:
var firebaseConfig = {
    apiKey: "AIzaSyBrlQjFfSctA_LV3fgjh-3wi6FqxXDA2xo",
    authDomain: "ss-reconnect.firebaseapp.com",
    databaseURL: "https://ss-reconnect.firebaseio.com",
    projectId: "ss-reconnect",
    storageBucket: "ss-reconnect.appspot.com",
    messagingSenderId: "418663478303",
    appId: "1:418663478303:web:0d3947e8714dd4b10d912a",
    measurementId: "G-FDYD2WEX7F"
  };
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var ref = {
  logOutput: database.ref("logOutput"),
  rooms: database.ref("rooms")
};

window.addEventListener("load", function() {
  document.getElementById("roomName").addEventListener("keyup", function() {
    // check if in use/not, then change button accordingly
  });
});
