var inquirer = require("inquirer");
var request = require("request");
var dotEnv = require("dotenv").config();
var moment = require('moment');
moment().format();
var Spotify = require("node-spotify-api");
var keys = require("./keys")
var spotify = new Spotify(keys.spotify)

function breakdown(arg) {
    var searchArr;
    var input = arg.toLowerCase().trim();
    var lastChar = input.slice(-1);
    if (lastChar == "?" || lastChar == ".") {
        var newInput = input.slice(0, input.length - 1)
        searchArr = newInput.split(" ");
        return searchArr;
    } else {
        searchArr = input.split(" ");
        return searchArr;
    };
}

function decide(arg) {
    var keyword = ["search", "look", "find"];
    var input;
    for (let i = 0; i < arg.length; i++) {
        for (let j = 0; j < keyword.length; j++) {
            if (arg[i] == keyword[j]) {
                if (arg[i + 1] == "up" || arg[i + 1] == "for") {
                    input = arg.slice(i + 2).join("+");
                    console.log(input)
                    return input;
                } else {
                    input = arg.slice(i + 1).join("+");
                    console.log(input)
                    return input;
                }
            }
        }
    }
};


function spotSearch(arg1, arg2) {
    spotify
        .search({ type: arg1, query: arg2 })
        .then(function (response) {
            var searchInfo = response[`${arg1}s`].items[0];
            if (arg1 == "track") {
                console.log(`Track: ${searchInfo.name}`);
                console.log(`Album: ${searchInfo.album.name}`);
                console.log(`Artist: ${searchInfo.artists[0].name}`);
                console.log(`Release Date: ${searchInfo.album.release_date}`);
            } else if (arg1 == "album") {
                console.log(`Album: ${searchInfo.name}`);
                console.log(`Artist: ${searchInfo.artists[0].name}`);
                console.log(`Release Date: ${searchInfo.release_date}`);
            } else if (arg1 == "artist") {
                console.log(`Artist: ${searchInfo.name}`);
                console.log(`Popularity: ${searchInfo.popularity}%`);
                console.log(`Followers: ${numberWithCommas(searchInfo.followers.total)}`);
                console.log("Genres: ")
                // for (var i = 0; i < searchInfo.genres; i++) {
                console.log(searchInfo.genres.join(", "));
                // }
            } else if (arg1 == "playlist") {
                console.log(`Playlist: ${searchInfo.name}`);
                console.log(searchInfo.tracks.href)
            }
            inquirer
            .prompt([
                {
                    type: "confirm",
                    message: "Would you like to look up showtimes?",
                    default: true,
                    name: "confirm"
                }
            ]).then(function(resp){
                if(resp.confirm){
                    BITSearch(refArg);
                } else {
                    anythingElse();
                }
            })
        })
        .catch(function (err) {
            console.log(err);
        });
};

function compare(arr1, arr2) {
    let found = arr1.some(r => arr2.indexOf(r) >= 0)
    return found;
};

function omdbSearch (arg){
    let refArg = arg.split(" ").join("+");
    let query = "http://www.omdbapi.com/?apikey=trilogy&t=" + refArg;
    request.get({url: query}, function (error, response, body){
            if (!error && response.statusCode == 200) {
                let data = JSON.parse(body);
                console.log('Title:', data.Title);
                console.log('Year:', data.Year);
                console.log('Rated:', data.Rated)
                console.log('IMDB Rating:', data.imdbRating);
                if (data.Ratings[1]){
                    console.log('Rotten Tomatoes:', data.Ratings[1].Value);
                } else {
                    console.log('Rotten Tomatoes:', "N/A")
                }
                console.log('Country:', data.Country);
                console.log('Language:', data.Language);
                console.log('Plot:', "\n" + data.Plot);
                console.log('Actors:', "\n" + data.Actors);
            } else {
                console.log('error', error, response && response.statusCode);
            }
    }).then(function(){
        
    })
}

function BITSearch  (arg){
    let query = "https://rest.bandsintown.com/artists/" + arg + "/events?app_id=codingbootcamp";
    request
        .get(query)
        .on("response", function(response){
            console.log(response);
        })
}

function lookFor(arg) {
    var searchType = ["album", "artist", "playlist", "music", "band", "track", "movie", "actor", "concert", "tickets", "showtime", "quit", "q", "exit", "break", "n", "no", "nothing"];
    var lastWord = arg.slice(-1).toString();
    if (compare(searchType, arg)) {
        let indexLast = searchType.indexOf(lastWord);
        
        for (var i = 0; i < arg.length; i++) {
            let indexArg = searchType.indexOf(arg[i]);
            if (indexArg !== -1) {
                var query = arg.slice(i + 1, arg.length).join(" ");
                if (query == ""){
                    if (indexLast >= searchType.length - 7) {
                        console.log("Have a nice day!");
                    } else {
                        inquirer.prompt({
                            type: "input",
                            message: `What is the name of the ${lastWord}?`,
                            name: "input"
                        }).then(function (resp) {
                            input = resp.input;
            
                            if (indexLast <= 5) {
                                spotSearch(searchThis(lastWord), input)
                            } else if (indexLast >= 6 && indexLast <= 7){
                                omdbSearch(input);
                            }
                            return input;
                        })
                    }
                } else if (indexArg <= 5){
                    spotSearch(searchThis(arg[i]), query);
                } else if (indexArg >= 6 && indexArg <= 7){
                    omdbSearch(query);
                }
            } 
        }
    } else if (indexLast == -1) {
        decide(arg);
    }
};

function searchThis(arg) {
    switch (arg) {
        case "band":
            type = "artist";
            return type;
        case "music":
            type = "track";
            return type;
        default:
            type = arg;
            return type;
    }
    // if (arg == "band") {
    //     type = "artist";
    //     return type;
    // } else if (arg == "music") {
    //     type = "track";
    //     return type;
    // } else {
    //     type = arg;
    //     return type;
    // }
};

function inquirerFunc() {
    inquirer
        .prompt([
            {
                type: "input",
                message: "what can I help you with?",
                name: "input"
            },
            {
                type: "confirm",
                message: "Are you sure?",
                name: "confirm",
                default: true
            }
        ]).then(function (resp) {
            var thisArr = breakdown(resp.input);
            if (resp.confirm) {
                lookFor(thisArr)
            } else {
                inquirerFunc();
            }
        }).catch(function (err) {
            console.log(err);
        });
};

function anythingElse() {
    inquirer
        .prompt([
            {
                type: "confirm",
                message: "Can I help you with anything else?",
                default: true,
                name: "anythingElse"
            }
        ]).then(function (resp) {
            if (resp.anythingElse === true) {
                inquirerFunc();
            } else if (resp.anythingElse === false) {
                console.log("Have a good day!");
            }
        }).catch(function (err) {
            console.log(err);
        });
};

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

inquirerFunc();