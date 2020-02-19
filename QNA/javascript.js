
var username = "";
var roomname = "";
var stateChanged = false;
var room = {};

/* ====================================================================================================================================================================================================
  # SETUP:
*/
// AJAX Setup:
function getAjax(url, success, error) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState > 3 && xhr.status === 200) {
      success(stringToObject(xhr.responseText));
    } else if (xhr.readyState > 3) {
      alert("There was an error.");
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
    stateChanged = false;
    if (d[roomname].state !== room.state) {
      stateChanged = true;
    }
    room = d[roomname];
    update();
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
  document.getElementById("usernameInput").addEventListener("keyup", checkRoom);
  document.getElementById("roomInput").addEventListener("keyup", checkRoom);
  document.getElementById("questionInput").addEventListener("keyup", checkQuestion);
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
    hide("login");
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
      hide("login");
      stateChange("waiting");
    } else { // User rejoined, change according to state
      hide("login");
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
    document.getElementById("submitQuestionButton").disabled = "false";
  } else {
    document.getElementById("submitQuestionButton").disabled = "true";
  }
}

function stateChange(newState) {
  load[newState]();
}
var load = {
  waiting: function() {
    alert("STATE CHANGED TO WAITING");
    show("waiting");
    document.getElementById("playerCount").innerText = `Waiting for players... (${room.users.length})`;
    if (username === room.vip) {
      show("startRoomForm");
      if (room.users.length >= 3) {
        document.getElementById("startRoomButton").disabled = false;
      }
    }
  },
  createQuestion: function() {
    alert("STATE CHANGED TO CREATE_QUESTION");
    show("createQuestion");
    document.getElementById("questionCount").innerText = `Enter a Question (${room.saved.questions[username].length + 1}/2):`;
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
