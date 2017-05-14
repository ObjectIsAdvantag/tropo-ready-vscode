

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
ChatOps.prototype.log = function (msg, isText) {
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
            "Authorization": "Bearer " + this.token
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
// Script logic starts here
//


// info level used to get a synthetic sump up of what's happing
var chatopsInfo = new ChatOps("SPARK_TOKEN", "CISCO_SPARK_ACTIVITY_ROOM_ID");
function info(logEntry) {
    log("INFO: " + logEntry);
    chatopsInfo.log(logEntry);
}

// debug level used to get detailled informations
var chatopsDebug = new ChatOps("SPARK_TOKEN", "CISCO_SPARK_DEBUG_ROOM_ID");
function debug(logEntry) {
    log("DEBUG: " + logEntry);
    chatopsDebug.log(logEntry);
}



TZ_OFFSET = 2; // UTC + 2 for amsterdam
function getTimeAtEvent() {
    return new Date(Date.now() + 3600000 * TZ_OFFSET);
}
function getTimeOnTropoServer() {
    return new Date(Date.now());
}

function formatTime(time) {
    var meridian = "AM";
    var hours = time.getHours();
    if (hours > 12) {
        meridian = "PM";
        hours -= 12;
    }
    return "" + hours + ":" + time.getMinutes() + " " + meridian;
}

function timeAtEvent() {
    return formatTime(getTimeAtEvent());
}

// Returns current time in format HH:MM AM|PM
function spellTimeAtEvent() {
    var meridian = "AM";
    var now = getTimeAtEvent();
    var hours = now.getHours();
    if (hours > 12) {
        meridian = "PM";
        hours -= 12;
    }
    return "" + hours + " " + meridian + " and " + now.getMinutes() + " minutes";
}

function anonymize(callerID) {
    return callerID.substring(0, 5);
}


// https://www.tropo.com/docs/scripting/international-features/speaking-multiple-languages
var currentVoice = "Steven";

// You may check currentCall features here : https://www.tropo.com/docs/scripting/currentcall
if (currentCall) {

    if (currentCall.network == "SMS") {
        debug("new incoming Voice call from: " + anonymize(currentCall.callerID));
        say("Welcome to CodeMotion Amsterdam 2017. Call this number to listen to our awesome agenda.");
        info("sent welcome SMS to: " + anonymize(currentCall.callerID));
    }

    else { // Voice
        // Speak a welcome message
        debug("new incoming Voice call from: " + anonymize(currentCall.callerID));
        wait(1000);
        say("Welcome to CodeMotion developer conference. It is now " + spellTimeAtEvent() + " in Amsterdam.", {
            voice: currentVoice
        });
        info("spoke the welcome message to: " + anonymize(currentCall.callerID));

        // Fetching a maximum of 10 upcoming activities
        var result = request("GET", "https://codemotion-amsterdam-2017.herokuapp.com/next?max=10", {
            headers: {
                'User-Agent': 'Tropo Scripting' // Optional
            },
            timeout: 5000,
            onTimeout: function () {
                debug("could not contact Event API, timeout");
                say("sorry could not contact our Agenda API, please try again later...", {
                    voice: currentVoice
                });
                info("could not fetch activities for: " + anonymize(currentCall.callerID));
            },
            onError: function (err) {
                debug("could not contact Event API on heroku, error: " + err.message);
                say("sorry could not contact our Agenda API, please try again later...", {
                    voice: currentVoice
                });
                info("could not fetch activities for: " + anonymize(currentCall.callerID));
            },
            onResponse: function (response) {
                if (response.statusCode != 200) {
                    debug("Event API returned an unexpected statusCode: " + response.statusCode);
                    say("sorry could not contact our Agenda API, please try again later...", {
                        voice: currentVoice
                    });
                    info("could not fetch activities for: " + anonymize(currentCall.callerID));
                }
                else {
                    var activities = JSON.parse(response.body);
                    debug("retreived " + activities.length + " activities after: " + timeAtEvent() + "(time at event)");
                    speakActivities(activities);
                }
            }
        });

        wait(1000);
        hangup();
    }
}
else {
    // Checking current time
    debug("Time at Event: " + getTimeAtEvent().toLocaleString());
    debug("Time at Event: it is now " + timeAtEvent());
    debug("Time at Event: formatted at " + spellTimeAtEvent());
    debug("Time on Tropo Server: " + getTimeOnTropoServer().toLocaleString());
}


function speakActivities(listOfActivities) {
    var nbActivities = listOfActivities.length;
    if (nbActivities == 0) {
        say("Sorry, we did not find any upcoming activity. Good bye.", {
            voice: currentVoice
        });
        info("no upcoming sessions for: " + anonymize(currentCall.callerID));
        wait(1000);
        hangup();
        throw createError("no upcoming activity, exiting");
    }

    // Pick a maximum of 10 sessions
    var MAX = 10;
    if (nbActivities > MAX) {
        debug("more than " + MAX + " activities after: " + timeAtEvent())
        nbActivities = MAX;
    }

    say("Here are the next 10 activities.", {
        voice: currentVoice
    });
    wait(500);

    // Propose MENU, removed option 0 for now
    var inviteIVR = "Dial One to receive more details by SMS, Two for next activity, and Three for previous activity.";
    var num = 0;
    var safeguard = 0; // to avoid loops on the scripting platform
    while (num < nbActivities && num >= 0) {
        debug("speaking activity number: " + (num + 1));

        safeguard++;
        if (safeguard > 50) {
            debug("safeguard fired for: " + anonymize(currentCall.callerID));
            hangup();
            throw createError("safeguard fired");
        }

        var currentActivity = listOfActivities[num];
        var event = ask("" + currentActivity.summary + " this " + currentActivity.beginDay + " at " + currentActivity.beginTime + ". " + inviteIVR, {
            voice: currentVoice,
            mode: 'dtmf', // dial tone modulation frequency only
            choices: "1,2,3,4",
            //mode: 'any',
            //choices: "1(One,Suscribe),2(Two,Details),3(Three,Next)",
            //recognizer: "en-us", 
            attempts: 1,
            timeout: 3,
            bargein: true, // Take action immediately when a Dial Tone is heard
            onEvent: function (event) {
                event.onTimeout(function () {
                    debug("choice timeout for user: " + anonymize(currentCall.callerID));
                    say("Sorry but I did not receive your answer", {
                        voice: currentVoice
                    });
                });
                event.onBadChoice(function () {
                    debug("bad choice for user: " + anonymize(currentCall.callerID));
                    say("Sorry I did not understand your answer", {
                        voice: currentVoice
                    });
                });
                event.onHangup(function () {
                    debug("user has hanged up: " + anonymize(currentCall.callerID));
                    num = nbActivities; // Stop IVR
                });
            }
        });

        // Take action corresponding to user choice
        if (event.name == 'choice') {
            debug("user: " + anonymize(currentCall.callerID) + " chose " + event.value);
            var selected = parseInt(String(event.value));
            switch (selected) {
                case 1:
                    debug("1: Details for activity: " + currentActivity.summary + " for: " + anonymize(currentCall.callerID));

                    // Send SMS in a new session
                    var forkedCall = call(currentCall.callerID, {
                        network: "SMS"
                    });
                    forkedCall.value.say("" + currentActivity.beginDay + ", " + currentActivity.beginTime +
                        ": '" + currentActivity.summary +
                        "' at '" + currentActivity.location +
                        "' ");

                    say("Got it. Sending you more details by SMS.", {
                        voice: currentVoice
                    });

                    // Send 2nd SMS if the Tropo number supports bidirectional SMS
                    //forkedCall.value.say("Reply with your email to join the 'CodeMotion Rome' room. See you in the Cisco Spark room says the bot");
                    //forkedCall.value.hangup();

                    info("sms sent for: " + currentActivity.summary + " to: " + anonymize(currentCall.callerID));

                    // Then move to next session
                    wait(500);
                    if (num == (nbActivities - 1)) {
                        say("Sorry, we do not have any activity after this one", {
                            voice: currentVoice
                        });
                        wait(500);
                    }
                    else {
                        say("Moving to next activity", {
                            voice: currentVoice
                        });
                        wait(500);
                        num++;
                    }
                    break;

                case 2:
                    debug("2: Next activity: " + currentActivity.title + " for: " + anonymize(currentCall.callerID));
                    if (num == (nbActivities - 1)) {
                        say("Sorry, no more activity after this one", {
                            voice: currentVoice
                        });
                        wait(500);
                    }
                    else {
                        say("Got it, moving forward to next activity", {
                            voice: currentVoice
                        });
                        wait(500);
                        num++;
                    }
                    break;

                case 3:
                    debug("2: Previous activity: " + currentActivity.summary + " for: " + anonymize(currentCall.callerID));
                    if (num == 0) {
                        say("Sorry we do not have any activity before this one", {
                            voice: currentVoice
                        });
                        wait(500);
                    }
                    else {
                        say("Got it, going back to previous activity", {
                            voice: currentVoice
                        });
                        wait(500);
                        num--;
                    }
                    break;

                case 4:
                    say("Wait! you don't like my voice ?", {
                        voice: currentVoice
                    });
                    wait(1000);
                    currentVoice = "Susan";
                    say("Is this better ?", {
                        voice: currentVoice
                    });
                    wait(1000);
                    break;

                default:
                    debug("unexpected choice from: " + anonymize(currentCall.callerID));
                    hangup();
                    throw createError("unexpected choice, exiting");
            }
        }

        else { // No choice was made, pick next session
            debug("X: no choice, picking next activity: " + currentActivity.title + " for: " + anonymize(currentCall.callerID));
            say("Moving forward to next activity ", {
                voice: currentVoice
            });
            wait(500);
            num++;
        }
    }

    debug("no more activity for: " + anonymize(currentCall.callerID));
    say("<speak>thank you for joining the Hackathon. Wish you a great Cisco API challenge <break time='500ms'/> Good bye</speak>", {
        voice: currentVoice
    });
}