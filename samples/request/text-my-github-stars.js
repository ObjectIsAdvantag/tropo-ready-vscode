/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */


////////////////////////////////////////////////////////////////////////////////////
// request: a synchronous HTTP client library for Tropo, built in the 'request' style
//
// forges an HTTP request towards the specified URL, and invokes the callback
//      - method: GET, POST, PUT, DELETE or PATCH
//      - url: Http endpoint you wish to hit
//      - options lets you specify HTTP headers, timeouts... and callbacks
//            * headers: set of HTTP key/values pairs
//            * timeout: enforces Connect and Read timeouts, defaults to 10s
//            * onTimeout(): fired if the timeout  expires
//            * onError(err): fires if an error occured
//            * onResponse(response): fires if the request is successful, see below for Response structure
//
// returns a result object with properties :
//      - type: 'response', 'error' or 'timeout'
//      - response: only if the type is 'response', with object properties:
//            * statusCode
//            * headers
//            * body
//
// v0.3.1
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
                        log("REQUEST: adding header: " + key + ", value: " + value);
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
            var bodyWriter = new java.io.DataOutputStream(connection.getOutputStream());
            var contents = options.body;
            if (options.json) {
                contents = JSON.stringify(options.body);
            }
            bodyWriter.writeBytes(contents);
            bodyWriter.flush();
            bodyWriter.close();
        }
        else {
            connection.setDoOutput(false);
            connection.connect();
        }

        var statusCode = connection.getResponseCode();
        result.response = { statusCode: statusCode };

        if ((statusCode >= 200) && (statusCode < 300)) {
            var bodyReader = connection.getInputStream();

            // [WORKAROUND] We cannot use a byte[], not supported on Tropo
            // var myContents= new byte[1024*1024];
            // bodyReader.readFully(myContents);
            contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader));
        }
        else if ((statusCode >= 400) && (statusCode < 600)) {
            var bodyReader = connection.getErrorStream();
            if (bodyReader) {
                contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader));
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
// This script texts the current number of stars for a github project
//    - star/unstar the project on github and listen to the changes in real time
//    - uses the trequest library to forge HTTP requests
//

if (currentCall) {

    var splitted = currentCall.initialText.split(" ");
    if (splitted.length != 2) {
        say("Please specify a Github account and a project");
        throw Error("terminating");
    }

    var account = splitted[0];
    var project = splitted[1];
    log("fetching GitHub starts for: " + account + "/" + project);

    request("GET", "https://api.github.com/repos/" + account + "/" + project, {
        headers: {
            // Github administrative rule: mandatory User-Agent header (http://developer.github.com/v3/#user-agent-required
            'User-Agent': 'Tropo'
        },
        timeout: 10000,
        onTimeout: function () {
            log("could not contact Github, timeout");
            say("sorry could not contact Github, try again later...");
            hangup();
        },
        onError: function (err) {
            log("could not contact Github, err: " + err.message);
            say("sorry could not contact Github, try again later...");
            hangup();
        },
        onResponse: function (response) {
            switch (response.statusCode) {
                case 200:
                    var info = JSON.parse(response.body);
                    log("fetched " + info.stargazers_count + " star(s)");
                    say("Congrats, " + project + " counts " + info.stargazers_count + " stars on Github");
                    break;

                case 404:
                    log("project not found");
                    say("Sorry, Github project not found. Please check Github account and repository name");
                    break;

                default:
                    log("wrong answer from Github, status code: " + response.statusCode);
                    say("Sorry, could not fetch your project Github's stars. Check https://github.com/" + account + "/" + project);
                    break;
            }
        }
    });

}
else {
    call(toNumber, { "network": "SMS" });
    say("Reply with your Github account and project name to receive its stars, exemple: CiscoDevNet awesome-ciscospark");
}