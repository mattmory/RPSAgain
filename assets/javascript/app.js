


var config = {
    apiKey: "AIzaSyC4uuH3UtLf9EUjqEudn1pzebVXeobO2c4",
    authDomain: "firstproject-6ed63.firebaseapp.com",
    databaseURL: "https://firstproject-6ed63.firebaseio.com",
    projectId: "firstproject-6ed63",
    storageBucket: "firstproject-6ed63.appspot.com",
    messagingSenderId: "114943761483"
};


firebase.initializeApp(config);
// Create a variable to reference the database
var database = firebase.database();

var rpsagainRef = database.ref("/RPSagain");
var chatRef = database.ref("/RPSagain/Chat");
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");
var gameStatus = {
    player1: "",
    player1score: 0,
    player1sign: "",
    player2: "",
    player2score: 0,
    player2sign: "",
    winnerString: ""
}
var currentUserIsP1 = false;
var currentUserIsP2 = false;
var user1hasQuit = false;
var playersDefined = false;
var roundComplete = false;

// Hide the chat application
$(".chatarea").hide();

// On the document load, look to see if a player one exists. If no.. wait. If yes, set up for player 2.
// If player 1 and 2 both exist.. let them know to wait.
$(document).ready(function () {
    database.ref("/RPSagain").once("value", function (snapshot) {
        //loading, looking for existing users.
        if ((snapshot.child("player1").exists()) && (snapshot.val().player1 !== "")) {
            // Player one exists, setup the screen.
            gameStatus.player1 = snapshot.val().player1;
            gameStatus.player1score = 0;
            buildPlayerName("#player-one-start", "#player-one-title", gameStatus.player1);
            //Now check for player two, first look for no player
            if (snapshot.val().player2 === "") {
                buildLogIn("#player-two-start", "player-two-name", "player-two-login");
            }
            // If a player two is logged in, show them as logged in and let the user know the game is full
            else {
                gameStatus.player2 = snapshot.val().player2;
                gameStatus.player2score = 0;
                buildPlayerName("#player-two-start", "#player-two-title", gameStatus.player2);
                alert("The game is full, please wait.");
            }
        }
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
});

window.onbeforeunload = function () {
    if (currentUserIsP1) {
        gameStatus = {
            player1: "",
            player1score: 0,
            player1sign: "",
            player2: "",
            player2score: 0,
            player2sign: "",
            winnerString: ""
        };
        //  database.ref("/RPSagain").update(gameStatus);
        database.ref("/RPSagain").remove();
        // chatRef.remove();

    }
    else if (currentUserIsP2 && !user1hasQuit) {
        database.ref("/RPSagain/Chat").push("INFO:: " + gameStatus.player2 + "(Player 2) has left the game.");
        gameStatus.player2 = "";
        gameStatus.player2score = 0;
        gameStatus.player2sign = 0;
        database.ref("/RPSagain").update(gameStatus);
        playersDefined = false;
    }
    else if (currentUserIsP2 && user1hasQuit) {
        //Do nothing.
    }
};


// When the client's connection state changes...
connectedRef.on("value", function (snap) {
    // If they are connected..
    if (snap.val()) {
        var con = connectionsRef.push(true);
        con.onDisconnect().remove();
    }
});

// Main database listener
database.ref("/RPSagain").on("value", function (snap) {
    // First Check.. If this is Player 1, see if Player 2 has joined, if so, set up P1's screen and start the game.
    if (!playersDefined) {
        if (currentUserIsP1 && gameStatus.player2 === "") {
            if (snap.val().player2 !== "") {
                gameStatus.player2 = snap.val().player2;
                $("#player-two-start").text("");
                $("#player-two-title").text(gameStatus.player2);
                setUpGamePlay("#player-one-card-body", "#player-one-rocks", "#player-one-paper", "#player-one-scissors");
                playersDefined = true;
            }
            else {
                $("#player-two-start").text("Waiting on Player 2");
                $("#player-two-title").text("");
            }
        }
        // Now check to see if player two has logged out
        else if (currentUserIsP1 && snap.val().player2 === "") {
            gameStatus.player1score = 0;
            gameStatus.player2score = 0;
            gameStatus.player2 = "";
            $("#player-two-start").text("Waiting on Player 2");
            $("#player-two-title").text("");
        }
        else if (currentUserIsP2 && snap.val() === null) {
            alert("Player 1 has quit the game. Reload and become Player 1");
            user1hasQuit = true;
        }
    }
    //look at the scores. User1 will do the scoreing. Upon completion it will reset User 1's screen and set the win, user 2 will look at that
    else {
        if (currentUserIsP1) {
            //Have player1 determine the score (Player 1 will control the scores)
            if ((snap.val().player1sign !== "") && (snap.val().player2sign !== "") && !roundComplete) {
                roundComplete = true;
                var winner = determineWinner(snap.val().player1sign, snap.val().player2sign);
                var winText = getWinnerText(winner);
                if (winner === 1) {
                    gameStatus.player1score++;
                    database.ref("/RPSagain/").update({ player1score: gameStatus.player1score })
                }
                else if (winner === -1) {
                    gameStatus.player2score++;
                    database.ref("/RPSagain/").update({ player2score: gameStatus.player2score })
                }
                database.ref("/RPSagain/").update({ winnerString: winText })
                roundComplete = true;
                displayWinner(winText);
            }
        }
        if (currentUserIsP2) {
            if (snap.val().winnerString !== "") {
                displayWinner(snap.val().winnerString);
            }
        }
    }

}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});


// Start Button Listener
$(document).on("click", ".player-start-button", function (event) {
    event.preventDefault();
    if ($(this).attr("id") === "player-one-login") {
        var userName = $("#player-one-name").val().trim();
        gameStatus.player1 = userName;
        database.ref("/RPSagain").update(gameStatus);
        buildPlayerName("#player-one-start", "#player-one-title", gameStatus.player1);
        currentUserIsP1 = true;
        $("#player-two-start").text("Waiting on Player Two.")
        chatRef.remove();
        database.ref("/RPSagain/Chat").push("INFO:: " + userName + " has joined the game as player 1.");
        // Add chat input box and chat button
        $(".chatarea").show();

    }
    else if ($(this).attr("id") === "player-two-login") {
        var userName = $("#player-two-name").val().trim();
        gameStatus.player2 = userName;
        database.ref("/RPSagain").update(gameStatus);
        buildPlayerName("#player-two-start", "#player-two-title", gameStatus.player2);
        currentUserIsP2 = true;
        database.ref("/RPSagain/Chat").push("INFO:: " + userName + " has joined the game as player 2.");
        // Add chat input box and chat button
        $(".chatarea").show();
        // Setup the play area
        setUpGamePlay("#player-two-card-body", "#player-two-rocks", "#player-two-paper", "#player-two-scissors");
        playersDefined = true;
    }
});

// Listener for sign objects
$(document).on("click", ".player-sign", function (event) {
    if (currentUserIsP1) {
        gameStatus.player1sign = $(this).attr("data-sign");
        setPlayerScreenWaiting("#player-one-card-body");
        database.ref("/RPSagain/").update({ player1sign: gameStatus.player1sign })
    }
    else if (currentUserIsP2) {
        gameStatus.player2sign = $(this).attr("data-sign");
        setPlayerScreenWaiting("#player-two-card-body");
        database.ref("/RPSagain/").update({ player2sign: gameStatus.player2sign })
    }
});



// Submit Text to the Chat 
$(document).on("click", "#chat-submit", function () {
    if ($("#chat-input").val().trim() !== "") {
        var newChat = $("#chat-input").val().trim();
        if (currentUserIsP1) {
            database.ref("/RPSagain/Chat").push(gameStatus.player1 + ": " + newChat);
        }
        else if (currentUserIsP2) {
            database.ref("/RPSagain/Chat").push(gameStatus.player2 + ": " + newChat);
        }
        $("#chat-input").val("");
    }
});

// Listen for chat changes and push it to the box
chatRef.on("child_added", function (snapshot) {
    chatAdd(snapshot.val() + "\n");
}, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
});

// Build log in prompt
function buildLogIn(playerSpan, playerInputName, playerButtonName) {
    $(playerSpan).empty();
    var $p2Input = new $("<input>");
    $p2Input.attr("type", "text");
    $p2Input.addClass("input-group-text");
    $p2Input.addClass("login-text");
    $p2Input.attr("id", playerInputName);
    var $p2btn = new $("<button>");
    $p2btn.attr("id", playerButtonName);
    $p2btn.text("Log In");
    $p2btn.addClass("btn");
    $p2btn.addClass("btn-primary");
    $p2btn.addClass("player-start-button");
    $(playerSpan).append($p2Input, $p2btn);
}

//Set the name heading if user is logged in. 
function buildPlayerName(playerSpan, playerCardTitle, playerName) {
    $(playerSpan).empty();
    $(playerCardTitle).text(playerName);
}

//To add to text the chatbox
function chatAdd(newChatText) {
    var $chatBox = $("#chat-box");
    $chatBox.append(newChatText);
    if ($chatBox.length) {
        $chatBox.scrollTop($chatBox[0].scrollHeight - $chatBox.height());
    }
}

//Set up the game play
function setUpGamePlay(cardName, rocksID, paperID, scissorsID, playerName, playerScore) {
    $(cardName).empty();
    var $rockP = new $("<p>");
    $rockP.addClass("card-text");
    $rockP.addClass("player-sign")
    $rockP.attr("id", rocksID);
    $rockP.attr("data-sign", "rock");
    $rockP.text("Rock");

    var $paperP = new $("<p>");
    $paperP.addClass("card-text");
    $paperP.addClass("player-sign")
    $paperP.attr("id", paperID);
    $paperP.attr("data-sign", "paper");
    $paperP.text("Paper");

    var $scissorsP = new $("<p>");
    $scissorsP.addClass("card-text");
    $scissorsP.addClass("player-sign")
    $scissorsP.attr("id", scissorsID);
    $scissorsP.attr("data-sign", "scissors");
    $scissorsP.text("Scissors")

  


    $(cardName).append($rockP, $paperP, $scissorsP);
}

// Build Player's Score Text
function displayScore(cardName, playerName, playerScore) {
    var $scoreDiv = new $("<div>");
    $scoreDiv.addClass("card-footer");
    $scoreDiv.addClass("text-muted");
    $scoreDiv.text(playerName + ": " + playerScore);
    $(cardName).append($scoreDiv);
}


//Set up waiting screen
function setPlayerScreenWaiting(cardName) {
    $(cardName).empty();
    var $p = new $("<p>");
    $p.text = "Waiting for opponent."
    $(cardName).append($p);
}

function determineWinner(playerOneSign, playerTwoSign) {
    //Start with a tie
    if (playerOneSign === playerTwoSign) {
        return 0;
    }
    else if ((playerOneSign === "rock") && (playerTwoSign === "scissors")) {
        return 1;
    }
    else if ((playerOneSign === "rock") && (playerTwoSign === "paper")) {
        return -1;
    }
    else if ((playerOneSign === "scissors") && (playerTwoSign === "rock")) {
        return -1;
    }
    else if ((playerOneSign === "scissors") && (playerTwoSign === "paper")) {
        return 1;
    }
    else if ((playerOneSign === "paper") && (playerTwoSign === "scissors")) {
        return -1;
    }
    else if ((playerOneSign === "paper") && (playerTwoSign === "rock")) {
        return 1;
    }
}

function getWinnerText(numWinner) {
    var winText = "It's a draw";
    if (numWinner === 1) {
        winText = gameStatus.player1 + " is the winner!";
    }
    else if (numWinner === -1) {
        winText = gameStatus.player2 + " is the winner!";
    }
    return winText;
}


//Display the winner for two seconds in the center box, then rebuild the screen.
function displayWinner(winText) {
    $("#results-body").empty()
    var $whoWon = new $("<p>");
    $whoWon.text(winText);
    $("#results-body").append($whoWon);
    // get the most current information to display the score information.

    database.ref("/RPSagain").once("value", function (snapshot) {
        gameStatus.player1 =  snapshot.val().player1;
        gameStatus.player2 = snapshot.val().player2;
        gameStatus.player1score = snapshot.val().player1score;
        gameStatus.player2score = snapshot.val().player2score;
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
});

    setTimeout(function () {
        gameStatus.player1sign = "";
        gameStatus.player2sign = "";
        if (currentUserIsP1) {
            database.ref("/RPSagain/").update({ player1sign: gameStatus.player1sign })
            database.ref("/RPSagain/").update({ player2sign: gameStatus.player2sign })
            setUpGamePlay("#player-one-card-body", "#player-one-rocks", "#player-one-paper", "#player-one-scissors");
            displayScore("#player-one-card-body", gameStatus.player1, gameStatus.player1score);
            $("#player-two-card-body").empty();
            displayScore("#player-two-card-body", gameStatus.player2, gameStatus.player2score);
        }
        else {
            setUpGamePlay("#player-two-card-body", "#player-two-rocks", "#player-two-paper", "#player-two-scissors");
            $("#player-one-card-body").empty();
            displayScore("#player-one-card-body", gameStatus.player1, gameStatus.player1score);
            displayScore("#player-two-card-body", gameStatus.player2, gameStatus.player2score);
        }
        $("#results-body").empty();
        roundComplete = false;
        database.ref("/RPSagain/").update({ winnerString: "" })

    }, 3000);


}

