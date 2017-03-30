/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// demonstrating transfer to a SIP URI
// --------------------------------------------
wait(1000);
say("Welcome to the transfering machine.");

say("Now, transferring you");

var result = transfer("sip:objectisadvantag@sip2sip.info", 30000);

if (result.name == "transfer") {
    log("successfully transferred");
}
else {
    log("transfer failed, reason: " + result.name);
}
