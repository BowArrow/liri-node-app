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
function whattype(arg) {
    var keyword = ["search", "look", "find"];
    inquirer
        .prompt([
            {
                type: "list",
                message: "What should I search for?",
                choices: ["Artist", "Track", "Playlist", "Album", "Movie"],
                name: "choice"
            },
            {
                type: "confirm",
                message: "Are you sure?",
                default: true,
                name: "confirm"
            }
        ]).then(function (resp) {
            function respSwitch(arg1, arg2) {
                if (arg1 == "Movie") {
                    omdbSearch(arg2);
                } else {
                    spotSearch(arg1.toLowerCase(), arg2)
                }
            }
            if (resp.confirm) {
                console.log(arg);
                if (compare(keyword, arg)) {
                    inquirer
                        .prompt([
                            {
                                type: "input",
                                message: `What is the name of the ${resp.choice}?`,
                                name: "name"
                            }
                        ]).then(function (nestresp) {
                            respSwitch(resp.choice, nestresp.name);
                        })
                } else {
                    respSwitch(resp.choice, arg)
                }
            } else {
                whattype(arg);
            }
        })
}

function decide(arg) {
    var keyword = ["search", "look", "find"];
    if (compare(keyword, arg) === false) {
        whattype(arg);
    } else {
        for (let i = 0; i < arg.length; i++) {
            for (let j = 0; j < keyword.length; j++) {
                if (arg[i] == keyword[j]) {
                    if (arg[i + 1] == "up" || arg[i + 1] == "for") {
                        input = arg.slice(i + 2).join("+");
                        whattype(input);
                    } else if (compare(keyword, arg)){
                        whattype(arg);
                    } else {
                        input = arg.slice(i + 1).join("+");
                        whattype(input);
                    }
                }
            }
        }
    }
};
function showtimes(arg) {
    inquirer
        .prompt([
            {
                type: "confirm",
                message: "Would you like to look up showtimes?",
                default: true,
                name: "confirm"
            }
        ]).then(function (resp) {
            if (resp.confirm) {
                BITSearch(arg);
            } else {
                anythingElse();
            }
        })
}

function spotSearch(arg1, arg2) {
    spotify
        .search({ type: arg1, query: arg2 })
        .then(function (response) {
            var searchInfo = response[`${arg1}s`].items[0];
            if (arg1 == "track") {
                let trackInfo = [
                    `Track: ${searchInfo.name}`,
                    `Album: ${searchInfo.album.name}`,
                    `Artist: ${searchInfo.artists[0].name}`,
                    `Release Date: ${searchInfo.album.release_date}`
                ].join("\n");
                console.log(trackInfo);
                showtimes(searchInfo.artists[0].name)
            } else if (arg1 == "album") {
                let albumInfo = [
                    `Album: ${searchInfo.name}`,
                    `Artist: ${searchInfo.artists[0].name}`,
                    `Release Date: ${searchInfo.release_date}`
                ].join("\n")
                console.log(albumInfo);
                showtimes(searchInfo.artists[0].name);
            } else if (arg1 == "artist") {
                let artistInfo = [
                    `Artist: ${searchInfo.name}`,
                    `Popularity: ${searchInfo.popularity}%`,
                    `Followers: ${numberWithCommas(searchInfo.followers.total)}`,
                    "Genres: ",
                    searchInfo.genres.join(", ")
                ].join("\n")
                console.log(artistInfo);
                showtimes(searchInfo.name)
            } else if (arg1 == "playlist") {
                console.log(`Playlist: ${searchInfo.name}`);
                console.log(searchInfo.tracks.href)
                anythingElse();
            }
        })
        .catch(function (err) {
            console.log(err);
        });
};

function compare(arr1, arr2) {
    let found = arr1.some(r => arr2.indexOf(r) >= 0)
    return found;
};

function omdbSearch(arg) {
    let refArg = arg.split(" ").join("+");
    let query = "http://www.omdbapi.com/?apikey=trilogy&t=" + refArg;
    request.get({ url: query }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            console.log('Title:', data.Title);
            console.log('Year:', data.Year);
            console.log('Rated:', data.Rated)
            console.log('IMDB Rating:', data.imdbRating);
            if (data.Ratings[1]) {
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
        anythingElse();
    })
}

function BITSearch(arg) {
    let query = "https://rest.bandsintown.com/artists/" + arg + "/events?app_id=codingbootcamp";
    request.get({ url: query }, function (error, response, body) {
        var BITJson = JSON.parse(body);
        for (var s = 0; s < BITJson.length; s++) {
            let data = BITJson[s];
            if (data.venue.country == "United States") {
                var logs = [
                    "Country: " + data.venue.country,
                    "Location: " + data.venue.city + ", " + data.venue.region,
                    "Lineup: " + data.lineup.join(", "),
                    "Date: " + moment(data.datetime).format("MM/DD/YYYY"),
                    "---------------------------------------------",
                    "---------------------------------------------"
                ].join("\n")
                console.log(logs);
            }
        }
        anythingElse();

    })


}

function lookFor(arg) {
    var searchType = ["album", "artist", "song", "music", "band", "track", "movie", "actor", "concert", "tickets", "showtime", "quit", "q", "exit", "break", "n", "no", "nothing"];
    var lastWord = arg.slice(-1).toString();
    if (compare(searchType, arg)) {
        let indexLast = searchType.indexOf(lastWord);

        for (var i = 0; i < arg.length; i++) {
            let indexArg = searchType.indexOf(arg[i]);
            if (indexArg !== -1) {
                var query = arg.slice(i + 1, arg.length).join(" ");
                if (query == "") {
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
                            } else if (indexLast >= 6 && indexLast <= 7) {
                                omdbSearch(input);
                            } else if (indexArg >= 8 && indexArg <= 10) {
                                BITSearch(input);
                            }
                            return input;
                        })
                    }
                } else if (indexArg <= 5) {
                    spotSearch(searchThis(arg[i]), query);
                } else if (indexArg >= 6 && indexArg <= 7) {
                    omdbSearch(query);
                } else if (indexArg >= 8 && indexArg <= 10) {
                    BITSearch(query);
                }
            }
        }
    } else {
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
        case "song":
            type = "track";
            return type;
        default:
            type = arg;
            return type;
    }
};

function inquirerFunc() {
    inquirer
        .prompt([
            {
                type: "input",
                message: "What can I help you with?",
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