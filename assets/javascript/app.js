


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


var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");
var gameStatus = {
    player1: "",
    player1score: 0,
    player1sign: "",
    player2: "",
    player2score: 0,
    player2sign: "",
}
var currentUserIsP1 = false;

// On the document load, look to see if a player one exists. If no.. wait. If yes, set up for player 2.
// If player 1 and 2 both exist.. let them know to wait.
window.onload(function (){
    database.ref("once","/RPSagain", function(snapshot)
    {
        //loading, looking for existing users.
        if(snapshot.)
    }  



// } );


// When the client's connection state changes...
connectedRef.on("value", function (snap) {

    // If they are connected..
    if (snap.val()) {
        var con = connectionsRef.push(true);
        con.onDisconnect().remove();
        if(!currentUserIsP1)
        {
            gameStatus.player2 = "";
            gameStatus.player2score = 0;
            gameStatus.player2sign = "";    
            gameStatus.player2 = "";
            gameStatus.player2score = 0;
            gameStatus.player2sign = "";               
            database.ref("/RPSagain").set(gameStatus);
        }
    }
});




$(".player-start-button").on("click", function (event) {
    event.preventDefault();
    if ($(this).attr("id") === "player-one-login") {
        console.log("Attempting to log in user 1");
        var userName = $("#player-one-name").val().trim();
        gameStatus.player1 = userName;
        database.ref("/RPSagain").update(gameStatus);
        $("#player-one-start").empty();
        var $playerSpan = new $("<span>");
        $playerSpan.text(gameStatus.player1)
        $("#player-one-start").append($playerSpan);
        currentUserIsP1 = true;
    }
    else if ($(this).attr("id") === "player-two-name") {
        console.log("Attempting to log in user 2");
        var userName = $("#player-two-name").val().trim();
    }
});

