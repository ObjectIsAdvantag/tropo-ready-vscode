/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// demonstrating sending a SMS to a phone number, and having the script respond to a user inbound SMS
//
// leverages the Tropo API Keys (Token URL) with query parameters
// https://www.tropo.com/docs/scripting/quickstarts/making-call/passing-parameters
//
// requires a Tropo number with bi-directional SMS capability 
// --------------------------------------------

if (currentCall) {
    var choice = currentCall.initialText.toLowerCase();
    if ((choice.startsWith("yes")) || (choice.startsWith("yep")) || (choice.startsWith("sure")) || (choice.startsWith("oui"))) {
        say("go get some !");
    }
    else {
        if ((choice.startsWith("no")) || (choice.startsWith("non"))) {
            say("well, I am not a big coffee drinker myself neither...");
        }
        else {
            say("sorry, I did not get your answer.");
        }
    }
}
else {
    call(toNumber, { "network": "SMS" });
    say("what about coffee ? (yes/no)");
}
