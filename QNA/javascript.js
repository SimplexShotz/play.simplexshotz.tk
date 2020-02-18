

/* ====================================================================================================================================================================================================
  # SETUP:
*/
// AJAX Setup:
function getAjax(url, success) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState > 3 && xhr.status === 200) success(stringToObject(xhr.responseText));
  };
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.send();
  return xhr;
}
function request(options, callback) {
  getAjax("https://cors-anywhere.herokuapp.com/https://reconnect.simplexshotz.repl.co/?" + objectToString(options), callback);
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


/* ====================================================================================================================================================================================================
  # EVENT LISTENERS:
*/
window.addEventListener("load", function() {
  document.getElementById("roomname").addEventListener("keyup", function() {
    document.getElementById("roomButton").disabled = true;
    request({ command: "checkRoom", room: document.getElementById("roomname").value }, function(res) {
      // Make sure the room is valid:
      if (document.getElementById("roomname").value === res.content && document.getElementById("roomname").value !== "") {
        if (res.type === "roomDoesNotExist") { // If the room doesn't exist, set the button to "createRoom"
          document.getElementById("roomButton").onclick = createRoom;
          document.getElementById("roomButton").innerText = "Create Room";
          document.getElementById("roomButton").disabled = false;
        } else if (res.type === "roomExists") { // If the room does exist, set the button to "joinRoom"
          document.getElementById("roomButton").onclick = joinRoom;
          document.getElementById("roomButton").innerText = "Join Room";
          document.getElementById("roomButton").disabled = false;
        }
      } else { // If it's not valid, keep the button disabled:
        document.getElementById("roomButton").disabled = true;
      }
    });
  });
});


/* ====================================================================================================================================================================================================
  # ROOM BUTTON FUNCTIONS:
*/
function createRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "createRoom", room: document.getElementById("roomname").value, game: "qna", vip: document.getElementById("username").value }, function(res) {
    console.log(res);
  });
}
function joinRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "joinRoom", room: document.getElementById("roomname").value, user: document.getElementById("username").value }, function(res) {
    console.log(res);
  });
}

/* ====================================================================================================================================================================================================
  # HELPER FUNCTIONS:
*/
function stringToObject(str) {
  var obj = {};
  str = str.split("&");
  // Convert:
  for (var i = 0; i < str.length; i++) {
    // "key='data'" -> { key: "data" }
    obj[str[i].split("=")[0]] = JSON.parse(str[i].split("=")[1]);
  }
  return obj;
}
function objectToString(obj) {
  var str = "";
  // Convert:
  for (var i in obj) {
    str += `${i}=${JSON.stringify(obj[i])}&`;
  }
  // Cut off the last "&":
  str = str.substring(0, str.length - 1);
  return str;
}
