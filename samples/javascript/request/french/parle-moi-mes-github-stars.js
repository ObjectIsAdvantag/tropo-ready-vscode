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



// Watch out: this is an I18N IVR in French
// 
// This script speaks the current number of stars for a github project
//    - star/unstar the project on github and listen to the changes in real time
//    - uses the request library to forge HTTP requests
//
// It speaks the number of stars 10 times with a 20 seconds interruption to hear people votes in real time
//
// As a bonus, typing 2 lets the caller change the voice from Male to Female.


answer();

wait(1000);
var currentVoice = "Thomas";
say("Bienvenue sur Guiteub Starze !", { voice: currentVoice });
wait(1000);

var account = "ObjectIsAdvantag";
var project = "tropo-ready-vscode";

var loops_avoider = 0;
while (loops_avoider++ < 5) {
    say("C'est parti, j'interroge 'Guiteub' pour le projet 'Tropo Ready V S Code'", { voice: currentVoice });

    var result = request("GET", "https://api.github.com/repos/" + account + "/" + project, {
        headers: {
            // Github administrative rule: mandatory User-Agent header (http://developer.github.com/v3/#user-agent-required
            'User-Agent': 'Tropo Scripting'
        },
        timeout: 5000,  // 5 seconds
        onTimeout: function () {
            log("could not contact Github, timeout");
            say("Pas de chance, je n'arrive pas à contacter Guiteub. Re-essaye plus tard...", { voice: currentVoice });
            hangup();
        },
        onError: function (err) {
            log("could not contact Github, err: " + err.message);
            say("Saperlipopette, je n'arrive pas à contacter Guiteub...", { voice: currentVoice });
            hangup();
        }
    });

    if (result.type == "response") {
        switch (result.response.statusCode) {
            case 200:
                var info = JSON.parse(result.response.body);
                log("fetched " + info.stargazers_count + " star(s)");
                say("Félicitations, ton projet a déjà " + info.stargazers_count + " étoiles", { voice: currentVoice });
                break;
            default:
                log("github returned statusCode: " + result.response.statusCode);
                say("Désolé, je n'ai pas réussi à récupérer le nombre d'étoiles pour ton projet Guiteub...", { voice: currentVoice });
                break;
        }
    }

    wait(1000);
    var result = ask("Allez, tu as 20 secondes pour voter... tape 1 lorsque tu as terminé", {
        choices: "1, 2",
        timeout: 20, // 20 seconds
        voice: currentVoice,
        onTimeout: function() {
            say("Délai écoulé !", { voice: currentVoice });
            wait(1000);
        } 
    });

    if (result.name == 'choice') {
        if (result.value == "1") { 
            say("Merci pour ton vote.", { voice: currentVoice });
            wait(1000);
        }
        if (result.value == "2") { 
            say("Quoi ? Tu n'aimes pas ma voix !", { voice: currentVoice });
            wait(1000);
            currentVoice = "Audrey"
            say("Et là ! c'est mieux ?", { voice: currentVoice });
            wait(1000);
        }
    }
}

hangup();