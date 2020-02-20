
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
var timeout;
function getAjax(url, success, error) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open("GET", url);
  xhr.onreadystatechange = function() {
    if (xhr.readyState > 3 && xhr.status === 200) {
      clearTimeout(timeout);
      if (stringToObject(xhr.responseText).status === "error") {
        alert("Error " + stringToObject(xhr.responseText).type + ". That's all we know.");
      } else {
        success(stringToObject(xhr.responseText));
      }
    } else if (xhr.readyState > 3 && xhr.status >= 400) {
      clearTimeout(timeout);
      alert("Error " + xhr.status + (errorCodes[xhr.status] ? " (" + errorCodes[xhr.status] + ")" : "") + ". That's all we know.");
    }
  };
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  xhr.send();
  return xhr;
}
function request(options, callback) {
  getAjax("https://cors-anywhere.herokuapp.com/https://reconnect.simplexshotz.repl.co/?" + objectToString(options), callback);
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    alert("The request is taking a while. Please check your internet connection.");
  }, 5000);
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
    if (d && d[roomname]) {
      stateChanged = false;
      if (d[roomname].state !== room.state) {
        stateChanged = true;
      }
      room = d[roomname];
      update();
    } else {
      alert("Room \"" + roomname + "\" no longer exists. You have been kicked from your room.");
      stateChange("login");
      username = "";
      roomname = "";
      room = {};
    }
  }
  checkRoom();
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
      if (room.saved.questions && room.saved.questions[username].length < 2 || room.saved.questions === undefined) { // user has more questions to input
        document.getElementById("questionCount").innerText = `Enter a Question (${room.saved.questions ? room.saved.questions[username].length + 1 : 1}/2):`;
        if (stateChanged) {
          stateChange("createQuestion");
        }
      } else { // user has inputed all questions
        var playersDone = 0;
        for (var i in room.saved.questions) {
          if (room.saved.questions[i].length >= 2) {
            playersDone++;
          }
        }
        document.getElementById("waitCount").innerText = `Waiting for other players to submit... (${playersDone}/${room.users.length})`;
        stateChange("waitingForOthers");
      }
      break;
    case "createAnswer":
      if (room.saved.answering && room.saved.answering[username] && room.saved.answering[username].length !== 0) { // user has more questions to answer
        document.getElementById("answerCount").innerText = `Answer the question (${(4 - room.saved.answering[username].length) + 1}/4):`;
        document.getElementById("questionToAnswer").innerText = room.saved.questions[room.saved.answering[username][0].user][room.saved.answering[username][0].question].question;
        if (stateChanged) {
          stateChange("createAnswer");
        }
      } else { // user has answered all questions
        var playersDone = 0;
        var playersCounted = 0;
        for (var i in room.saved.answering) {
          if (room.saved.answering[i].length === 0) {
            playersDone++;
          }
          playersCounted++;
        }
        playersDone += room.users.length - playersCounted;
        document.getElementById("waitCount").innerText = `Waiting for other players to submit... (${playersDone}/${room.users.length})`;
        stateChange("waitingForOthers");
      }
      break;
    case "pickAnswer":
      if (stateChanged) {
        stateChange("pickAnswer");
      }
      break;
  }
}


/* ====================================================================================================================================================================================================
  # EVENT LISTENERS:
*/
window.addEventListener("load", function() {
  // Load previous username and roomname from local storage
  if (localStorage.getItem("username")) {
    document.getElementById("usernameInput").value = localStorage.getItem("username");
  }
  if (localStorage.getItem("roomname")) {
    document.getElementById("roomInput").value = localStorage.getItem("roomname");
  }

  // Room checking:
  document.getElementById("usernameInput").addEventListener("keyup", checkRoom);
  document.getElementById("roomInput").addEventListener("keyup", checkRoom);

  // Question/Answer checking:
  document.getElementById("questionInput").addEventListener("keyup", checkQuestion);
  document.getElementById("answerInput").addEventListener("keyup", checkAnswer);
  checkRoom();
});


/* ====================================================================================================================================================================================================
  # ROOM BUTTON FUNCTIONS:
*/
function checkRoom() {
  document.getElementById("roomButton").disabled = true;
  if (document.getElementById("usernameInput").value !== "" && document.getElementById("roomInput").value !== "") {
    request({ command: "checkRoom", room: document.getElementById("roomInput").value }, function(res) {
      // Make sure the room is valid:
      if (document.getElementById("roomInput").value === res.content) {
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
}
function createRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "createRoom", room: document.getElementById("roomInput").value, game: "qna", vip: document.getElementById("usernameInput").value }, function(res) {
    console.log(res);
    username = res.user;
    roomname = res.room;
    room = res.content;
    stateChange("waiting");
  });
}
function joinRoom() {
  document.getElementById("roomButton").disabled = true;
  request({ command: "joinRoom", room: document.getElementById("roomInput").value, user: document.getElementById("usernameInput").value }, function(res) {
    console.log(res);
    username = res.user;
    roomname = res.room;
    room = res.content;
    if (res.type === "userJoined") {
      stateChange("waiting");
    } else { // User rejoined, change according to state
      hide("login");
      document.getElementById("title").innerText = "[" + roomname + "] " + username;
      stateChange(room.state);
      update(); // TODO: test
    }
  });
}

function checkQuestion() {
  document.getElementById("submitQuestionButton").disabled = true;
  if (document.getElementById("questionInput").value !== "" || room.saved.questions[username].length >= 2) {
    document.getElementById("submitQuestionButton").disabled = false;
  }
}
function checkAnswer() {
  document.getElementById("submitAnswerButton").disabled = true;
  if (document.getElementById("answerInput").value !== "") { // TODO
    document.getElementById("submitAnswerButton").disabled = false;
  }
}

function stateChange(newState) {
  load[newState]();
}
var load = {
  login: function() {
    document.getElementById("title").innerText = "QNA";
    hide("waiting");
    hide("startRoomButton");
    hide("createQuestion");
    hide("createAnswer");
    hide("pickAnswer");
    hide("waitingForOthers");
    document.getElementById("startRoomButton").disabled = true;
    show("login");
    checkRoom();
  },
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
  },
  createAnswer: function() {
    hide("createQuestion");
    hide("waitingForOthers");
    show("createAnswer");
    if (room.saved.answering[username] && room.saved.answering[username][0]) {
      //                                                                         (4 total questions - questions left) + 1
      document.getElementById("answerCount").innerText = `Answer the question (${(4 - room.saved.answering[username].length) + 1}/4):`;
      //                                                      room.saved.questions[                 user                 ][             question number             ] .question
      document.getElementById("questionToAnswer").innerText = room.saved.questions[room.saved.answering[username][0].user][room.saved.answering[username][0].question].question;
    }
  },
  pickAnswer: function() {
    hide("createAnswer");
    hide("waitingForOthers");
    show("pickAnswer");
  },
  waitingForOthers: function() {
    hide("createQuestion");
    hide("createAnswer");
    show("waitingForOthers");
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
  # SUBMIT FUNCTIONS:
*/
function submitQuestion() {
  document.getElementById("submitQuestionButton").disabled = true;
  request({ command: "submit", room: roomname, user: username, input: document.getElementById("questionInput").value }, function(res) {
    document.getElementById("questionInput").value = "";
  });
}
function submitAnswer() {
  document.getElementById("submitAnswerButton").disabled = true;
  request({ command: "submit", room: roomname, user: username, input: document.getElementById("answerInput").value }, function(res) {
    document.getElementById("answerInput").value = "";
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


/* ====================================================================================================================================================================================================
  # FUN FUNCTION:
*/
var funCount = 0;
function fun() {
  funCount++;
  document.getElementById("funButton").innerText = funCount;
}
