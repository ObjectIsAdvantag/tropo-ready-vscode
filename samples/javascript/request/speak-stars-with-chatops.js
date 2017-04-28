/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */


////////////////////////////////////////////////////////////////////////////////////
// request:
//     a synchronous HTTP client library for Tropo, built in the "request" style
//
// forges an HTTP request towards the specified URL
//      - method: GET, POST, PUT, DELETE or PATCH
//      - url: Http endpoint you wish to hit
//      - options lets you specify HTTP headers, timeouts... and callbacks
//            * headers: set of HTTP key/values pairs
//            * timeout: enforces Connect and Read timeouts, defaults to 10s
//            * onTimeout(): function fired if the timeout  expires
//            * onError(err): function fired if an error occured
//            * onResponse(response): function fired if the request is successful, see below for the structure of the response
//
// returns a result object with properties :
//      - type: 'response', 'error' or 'timeout'
//      - response: only if the type is 'response', with object properties:
//            * statusCode: integer
//            * headers: map of key/values pairs, values are either strings or arrays depending on the header
//            * body: string
//
// v0.4.0
//
function request(method, url, options) {
    // Tropo Emulator friendly: inject the trequest function when script is run locally
    if (global.request) {
        return global.request(method, url, options);
    }

    // from now on, we're running on Tropo Scripting platform
    if (!method || !url) {
        throw Error("Invalid arguments, expecting method & url at a minimum");
    }
    if ((method !== "GET") && (method !== "POST") && (method !== "PUT") && (method !== "DELETE") && (method !== "PATCH")) {
        throw Error("Method " + method + " is not supported");
    }

    // TODO: Check URL is not malformed

    // Default timeout
    var timeout = options.timeout ? options.timeout : 10000;

    // Fetch contents
    var result = {};
    var contents = null;
    var connection = null;
    try {
        connection = new java.net.URL(url).openConnection();
        connection.setConnectTimeout(timeout);
        connection.setReadTimeout(timeout);

        connection.setDoInput(true);
        connection.setRequestMethod(method);
        connection.setInstanceFollowRedirects(false);

        if (options.headers) {
            for (var key in options.headers) {
                if (options.headers.hasOwnProperty(key)) {
                    // add header
                    var value = options.headers[key];
                    if (typeof value !== "string") {
                        log("REQUEST: headers key: " + key + " does not contain a string, ignoring...");
                    }
                    else {
                        connection.setRequestProperty(key, value);
                    }
                }
            }
        }
        if (options.json) {
            connection.setRequestProperty("Content-Type", "application/json");
        }

        if (options.body) {
            connection.setDoOutput(true);
            var payload = options.body;
            if (options.json) {
                payload = JSON.stringify(options.body);
            }
            var bodyWriter = connection.getOutputStream();
            org.apache.commons.io.IOUtils.write(payload, bodyWriter, "UTF-8");
            bodyWriter.flush();
            bodyWriter.close();
        }
        else {
            connection.setDoOutput(false);
            connection.connect();
        }

        var statusCode = connection.getResponseCode();
        result.response = { statusCode: statusCode };

        // Read response if exists
        var contents;
        if ((statusCode >= 200) && (statusCode < 300)) {
            var bodyReader = connection.getInputStream();
            contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader, "UTF-8"));
        }
        else if ((statusCode >= 400) && (statusCode < 600)) {
            var bodyReader = connection.getErrorStream();
            if (bodyReader) {
                contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader, "UTF-8"));
            }
        }
        result.response.body = contents;

        // Invoke response callback
        if (options.onResponse) {
            options.onResponse(result.response);
        }

        // Return response
        result.type = "response";
        return result;
    }
    catch (err) {
        log("REQUEST: could not reach url, err: " + err.message);

        // Invoke error callback
        if (options.onError) {
            options.onError(err);
        }

        // Return response
        result.type = "error";
        result.error = err;
        return result;
    }
}
//
///////////////////////////////////////////////////////////////////////////////////////



//
// Cisco Spark ChatOps
//
function ChatOps(token, roomId, timeout) {
    if (!token || !roomId) {
        log("CHATOPS: bad arguments, will not log");     
    }
    else {
        this.token = token;
        this.roomId = roomId;
    }

    // Defaults to 10s
    if (!timeout) {
        this.timeout = 10000;
    }
    else {
        this.timeout = timeout;
    }
}

// Logs a message to a Cisco Spark room in markdown by default
//    - isText: boolean to push your message as raw text
ChatOps.prototype.log = function(msg, isText) {
    if (!this.token || !this.roomId || !msg) {
        return;
    }

    var payload = { roomId: this.roomId };
    if (isText) {
        payload.text = msg;
    }
    else {
        payload.markdown = msg;
    }

    var result = request("POST", "https://api.ciscospark.com/v1/messages", {
        headers: {
            "Authorization" : "Bearer " + this.token
        },
        json: true,
        body: payload,
        timeout: this.timeout,
        onTimeout: function () {
            log("CHATOPS: could not contact CiscoSpark, timeout");
        },
        onError: function (err) {
            log("CHATOPS: could not contact CiscoSpark, err: " + err.message);
        },
        onResponse: function (response) {
            if (response.statusCode != 200) {
                log("CHATOPS: could not log to CiscoSpark, statusCode: " + response.statusCode);
                if (response.body) {
                    log("CHATOPS: could not log to CiscoSpark, payload: " + response.body);
                }
            }
        }
    });
}


// 
// This script lets people vote live at a conference
// Each vote populates a Cisco Spark Room
// As a bonus, typing 3 lets the caller change the voice from Male to Female.
//


// Here are some guidelines to do ChatOps for Tropo Inbound calls
//   - Create a bot account and paste its access token 
var sparkToken = "CISCO_SPARK_API_ACCESS_TOKEN";
//   - Create a room, and paste the room id here
var sparkRoom = "ROOM_IDENTIFIER";


// and don't forget to add the bot to the roomId
var chatops = new ChatOps(sparkToken, sparkRoom);

function anonymize(callerID) {
    if ((!callerID) || (callerID.length < 8)) {
        return "unknown";
    }
    return callerID.substring(4, 8);
}



// 
// This script speaks the current number of stars for a github project
//    - star/unstar the project on github and listen to the changes in real time
//    - uses the trequest library to forge HTTP requests
//

answer();
wait(1000);

currentVoice = "Tom";
say("Welcome to Guithub Stars !", { voice: currentVoice }); // [WORKAROUND] Changed to Guithub to enhance pronounciation
chatops.log("Speaking the welcome message to: " + anonymize(currentCall.callerID));

var account = "ObjectIsAdvantag";
var project = "tropo-ready-vscode";

var loops_avoider = 0;
while (loops_avoider++ < 5) {

    say("Asking GuitHub info about the Tropo Ready V S Code project ...", { voice: currentVoice });

    var account = "ObjectIsAdvantag";
    var project = "tropo-ready-vscode";
    var result = request("GET", "https://api.github.com/repos/" + account + "/" + project, {
        headers: {
            // Github administrative rule: mandatory User-Agent header (http://developer.github.com/v3/#user-agent-required
            'User-Agent': 'Tropo Scripting'
        },
        timeout: 10000,
        onTimeout: function () {
            log("could not contact Github, timeout");
            say("sorry could not contact Guithub, try again later...");
            hangup();
        },
        onError: function (err) {
            log("could not contact Github, err: " + err.message);
            say("sorry could not contact Guithub, try again later...");
            hangup();
        },
        onResponse: function (response) {
            switch (response.statusCode) {
                case 200:
                    var info = JSON.parse(response.body);
                    log("fetched " + info.stargazers_count + " star(s)");
                    chatops.log("Told " + info.stargazers_count + " stars to: " + anonymize(currentCall.callerID));
                    say("Congrats, your project counts " + info.stargazers_count + " stars.", { voice: currentVoice })
                    wait(1000);
                    break;
                default:
                    log("github returned statusCode: " + response.statusCode);
                    say("Sorry, could not retreive your project stars", { voice: currentVoice });
                    wait(1000);
                    break;
            }
        }
    });

    say("Are you ready for a challenge ?", { voice: currentVoice });
    wait("500");
    var result = ask("You now have 20 seconds to vote for the Tropo Ready V S Code project on Guithub... Type 1 when done", {
        choices: "1, 2",
        timeout: 20, // 20 seconds
        voice: currentVoice,
        onTimeout: function () {
            say("Sorry, time has elapsed", { voice: currentVoice });
            wait(1000);
        },
        onChoice: function (response) {
            if (result.value == "1") {
                say("Thanks for your vote", { voice: currentVoice });
                wait(1000);
            }
            if (result.value == "2") {
                say("What? you don't like my voice ? ", { voice: currentVoice });
                wait(1000);
                currentVoice = "Vanessa"
                say("And now, is it better ?", { voice: currentVoice });
                wait(1000);
            }
        }
    });
}

say("Bye bye...")
wait(500);
