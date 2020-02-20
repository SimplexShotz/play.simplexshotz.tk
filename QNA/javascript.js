
var username = "";
var roomname = "";
var stateChanged = false;
var room = {};

/* ====================================================================================================================================================================================================
  # SETUP:
*/
// AJAX Setup:
var errorCodes = {
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  425: "Too Early",
  426: "Ugrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  451: "Unavailable For Legal Reasons",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required"
};
function getAjax(url, success, error) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState > 3 && xhr.status === 200) {
      if (stringToObject(xhr.responseText).status === "error") {
        alert("Error " + stringToObject(xhr.responseText).type + ". That's all we know.");
      } else {
        success(stringToObject(xhr.responseText));
      }
    } else if (xhr.readyState > 3 && xhr.status >= 400) {
      alert("Error " + xhr.status + (errorCodes[xhr.status] ? " (" + errorCodes[xhr.status] + ")" : "") + ". That's all we know.");
    }
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

ref.rooms.on("value", function(data) {
  var d = data.val();
  if (roomname) {
    console.log(d[roomname]);
    if (d[roomname] === undefined) {
      alert("THE ROOM HAS BEEN DELETED.");
    } else {
      stateChanged = false;
      if (d[roomname].state !== room.state) {
        stateChanged = true;
      }
      room = d[roomname];
      update();
    }
  }
});

function update() {
  switch(room.state) {
    case "waiting":
      document.getElementById("playerCount").innerText = `Waiting for players... (${room.users.length})`;
      if (username === room.vip && room.users.length >= 3) {
        document.getElementById("startRoomButton").disabled = false;
      }
      break;
    case "createQuestion":
      if (stateChanged) {
        stateChange("createQuestion");
      }
      break;
  }
}


/* ====================================================================================================================================================================================================
  # EVENT LISTENERS:
*/
window.addEventListener("load", function() {
  if (localStorage.getItem("username")) {
    document.getElementById("usernameInput").value = localStorage.getItem("username");
  }
  if (localStorage.getItem("roomname")) {
    document.getElementById("roomInput").value = localStorage.getItem("roomname");
  }
  document.getElementById("usernameInput").addEventListener("keyup", checkRoom);
  document.getElementById("roomInput").addEventListener("keyup", checkRoom);
  document.getElementById("questionInput").addEventListener("keyup", checkQuestion);
  checkRoom();
});


/* ====================================================================================================================================================================================================
  # ROOM BUTTON FUNCTIONS:
*/
function checkRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "checkRoom", room: document.getElementById("roomInput").value }, function(res) {
    // Make sure the room is valid:
    if (document.getElementById("roomInput").value === res.content && document.getElementById("usernameInput").value !== "" && document.getElementById("roomInput").value !== "") {
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
}
function createRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "createRoom", room: document.getElementById("roomInput").value, game: "qna", vip: document.getElementById("usernameInput").value }, function(res) {
    username = res.user;
    roomname = res.room;
    room = res.content;
    stateChange("waiting");
  });
}
function joinRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "joinRoom", room: document.getElementById("roomInput").value, user: document.getElementById("usernameInput").value }, function(res) {
    username = res.user;
    roomname = res.room;
    room = res.content;
    if (res.type === "userJoined") {
      stateChange("waiting");
    } else { // User rejoined, change according to state
      hide("login");
      document.getElementById("title").innerText = "[" + roomname + "] " + username;
      switch(room.state) { // TODO: implement all states + test
        case "waiting":
          stateChange("waiting");
          break;
        case "createQuestion":
          stateChange("createQuestion");
          break;
      }
    }
  });
}

function checkQuestion() {
  if (document.getElementById("questionInput").value !== "") {
    document.getElementById("submitQuestionButton").disabled = false;
  } else {
    document.getElementById("submitQuestionButton").disabled = true;
  }
}

function stateChange(newState) {
  load[newState]();
}
var load = {
  waiting: function() {
    document.getElementById("title").innerText = "[" + roomname + "] " + username;
    localStorage.setItem("username", username);
    localStorage.setItem("roomname", roomname);
    hide("login");
    show("waiting");
    document.getElementById("playerCount").innerText = `Waiting for players... (${room.users.length})`;
    if (username === room.vip) {
      show("startRoomButton");
      if (room.users.length >= 3) {
        document.getElementById("startRoomButton").disabled = false;
      }
    }
  },
  createQuestion: function() {
    hide("waiting");
    show("createQuestion");
    document.getElementById("questionCount").innerText = `Enter a Question (${room.saved.questions ? room.saved.questions[username].length + 1 : 1}/2):`;
  }
};

/* ====================================================================================================================================================================================================
  # START GAME FUNCTION:
*/
function startRoom() {
  request({ command: "startRoom", room: roomname }, function(res) {
    console.log(res);
  });
}


/* ====================================================================================================================================================================================================
  # DOM HELPER FUNCTIONS:
*/
function show(id) {
  document.getElementById(id).style.display = "block";
}
function hide(id) {
  document.getElementById(id).style.display = "none";
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
