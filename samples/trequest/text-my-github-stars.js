/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// 
// This script speaks the current number of stars for a github project
//    - star/unstar the project on github and listen to the changes in real time
//    - uses the trequest library to forge HTTP requests
//

////////////////////////////////////////////////////////////////////////////////////
// trequest: an HTTP client library for Tropo, built in the "request" module style
//
// forges an HTTP request towards the specified URL, and invokes the callback
//
// options lets you specify HTTP headers and a read/connect timeout
//      - url: destination
//      - headers: set of HTTP key/values pairs
//      - timeout: applies Connect and Read timeouts
//
// callback signature is function(err, response, body)
//      - err.message: "java.net.SocketTimeoutException: Connect timed out"
//      - err.message: "java.net.SocketTimeoutException: Read timed out"
//
//      - response object containing the status code
//
//      - body contents are formatted string. When retrieving JSON data, simply use JSON.parse(body)
//
function trequest(options, cb) {
    // Tropo Emulator friendly: inject the trequest function when script is run locally
    if (global.trequest) {
        if (cb) {
            global.trequest(options, cb);
        }
        else {
            global.trequest(options);
        }
        return;
    }

    // we're now running on Tropo Scripting platform

    if (!options) {
        if (cb) cb(Error("Invalid arguments, expecting options at a minimum"), null, null);
        return;
    }

    var url = options.url;
    if (!url) {
        if (cb) cb(Error("Missing URL in options"), null, null);
        return;
    }

    var timeout = options.timeout ? options.timeout : 10000;

    // Fetch contents
    var res = {};
    var contents = null;
    var connection = null;
    try {
        connection = new java.net.URL(url).openConnection();
        connection.setConnectTimeout(timeout);
        connection.setReadTimeout(timeout);

        if (options.headers) {
            for (var property in options.headers) {
                if (options.hasOwnProperty(property)) {
                    // add header
                    var value = options.headers[property];
                    if (typeof value !== "string") {
                        log("TREQUEST: headers property: " + property + " does not contain a string, ignoring...");
                    }
                    else {
                        connection.setRequestProperty(property, value);
                    }
                }
            }
        }

        connection.setDoOutput(false);
        connection.setDoInput(true);
        connection.setRequestMethod("GET");
        connection.setInstanceFollowRedirects(false);

        connection.connect();
        
        var statusCode = connection.getResponseCode();
        res.statusCode = statusCode;
        
        if ((statusCode >= 200) && (statusCode < 300)) {
            var bodyReader = connection.getInputStream();

            // [WORKAROUND] We cannot use a byte[], not supported on Tropo
            // var myContents= new byte[1024*1024];
            // bodyReader.readFully(myContents);
            contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader));
        }
        else if ((statusCode >= 400) && (statusCode < 600)) {
            var bodyReader = connection.getErrorStream();

            // [WORKAROUND] We cannot use a byte[], not supported on Tropo
            // var myContents= new byte[1024*1024];
            // bodyReader.readFully(myContents);
            contents = new String(org.apache.commons.io.IOUtils.toString(bodyReader));
        }
        else {
            // No contents
            if (cb) cb(null, res, null);
        }
    }
    catch (err1) {
        log("TREQUEST: could not reach url, err: " + err1.message);
        if (cb) cb(err1, null, null);
        return;
    }

    if (cb) cb(null, res, contents);
}
//
///////////////////////////////////////////////////////////////////////////////////////

if (currentCall) {

    var splitted = currentCall.initialText.split(" ");
    if (splitted.length != 2) {
        say("Please specify a Github account and a project");
        throw Error("terminating");
    }

    var account = splitted[0];
    var project = splitted[1];
    log("fetching GitHub starts for: " + account + "/" + project);

    // Github administrative rule: mandatory User-Agent header (http://developer.github.com/v3/#user-agent-required
    var options = {
        url: "https://api.github.com/repos/" + account + "/" + project,
        headers: {
            'User-Agent': 'Tropo'
        }, timeout: 10000
    };

    trequest(options, function (err, response, body) {
        if (err) {
            log("could not contact Github, err: " + err.message);
            say("Github did not answer. Try again later or check https://github.com/" + account + "/" + project);
            throw Error("no data, terminating...");
        }

        switch (response.statusCode) {
            case 200:
                var info = JSON.parse(body);
                log("fetched " + info.stargazers_count + " star(s)");
                say("Congrats, project has " + info.stargazers_count + " stars on Github");
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
    });
}
else {
    call(toNumber, { "network": "SMS" });
    say("Reply with your Github account and project name to receive its stars, exemple: CiscoDevNet awesome-ciscospark");
}