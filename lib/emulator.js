/*
 * Copyright (c) 2017 Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */


var commandLineArgs = require('command-line-args')

var optionDefinitions = [
    { name: 'script', type: String, defaultOption: true },              // the script to load
    { name: 'callerID', alias: 'c', type: String },                     // sets the callerID if the call is Inbound. If outbound, the option is ignored
    { name: 'SMS', alias: 's', type: Boolean },                         // marks the call as a text channel, whether inbound or outbound
    { name: 'initialText', type: String },                              // set the specified initial text. If not SMS call, the option is ignored
    { name: 'outbound', alias: 'o', type: Boolean },                    // starts the script in the context of an outbound call
    { name: 'parameters', alias: 'p', type: String, multiple: true },   // pass parameters, example: "phonenumber=+33678007800" 
    { name: 'checkOptions', type: Boolean },                            // if true, checks if "Choice Options"" patterns used in the script are well-formed
    { name: 'help', alias: 'h', type: Boolean },                        // shows help
    { name: 'version', alias: 'v', type: Boolean }                      // shows help
];

var args;
try {
    args = commandLineArgs(optionDefinitions)
}
catch (err) {
    if (err.name === "UNKNOWN_OPTION") {
        console.log(err.message + "\n");
        help();
        process.exit(1);
    }
}

if (args.version) {
    console.log("v0.1.0");
    process.exit(0);
}

function help() {
    var command = "tropoready";
    console.log("Usage: "+ command + " [--script] <your-script.js>\n");
    console.log("Simulates a Tropo runtime environment to quickly check for obvious inconsistencies (syntax error, wrong arguments).");
    console.log("By default, starts the specified script in the context of a Tropo Inbound Voice call.\n");
    console.log("To test for an Outbound SMS call, try:\n   > " + command + " <your-script.js> --outbound --SMS \n");
    console.log('To pass parameters, try:\n   > ' + command + ' <your-script.js> --parameters "phonenumber=+33678007800" "msg=Hello world!"\n');
    console.log("Supported options:");
    console.log("   -c, --callerID '+33678007800' : sets the callerID for Inbound calls. Ignored if the call is Outbound");
    console.log("   --checkOptions                : if true, verifies that the script 'Choice Options' pattern are well-formed");
    console.log("   -h,--help                     : shows usage");
    console.log("   --initialText                 : set the specified initial text. Ignored if the call is not on a SMS channel");
    console.log("   -o, --outbound                : starts the script in the context of an outbound call");
    console.log("   -p, --parameters              : injects variables parameters, example: -p 'phonenumber=+33678007800'");
    console.log("   -s, --SMS                     : marks the call as a text channel, whether inbound or outbound");
    console.log("   [--script] filename.js        : specify the script to start. Note that the '--script' mention is optional");
    console.log("   -v,--version                  : shows version");
}
if (args.help) {
    help();   
    process.exit(0);
}

var currentCall = null;
if (!args.outbound) { // inbound call
    currentCall = {};
    currentCall.callerID = args.callerID || "+33678007800";
    if (args.SMS) {
        currentCall.channel = "SMS";
        currentCall.initialText = args.initialText;
    }
    else {
        currentCall.channel = "VOICE";
    }
}
else { // outbound call

    // Inject dynamic variables
    if (args.parameters) {
        args.parameters.forEach(function (elem) {
            var match = elem.match(/^(\w+)\=(.+)/);
            if (match) {
                global[match[1].trim()] = match[2].trim();
            }
        });
    }
}

var CHECK_CHOICES_PATTERN = args.checkOptions;



//
// Emulator library
//

function answer() {
    console.log("[Tropo answers   ] ...");
}

function hangup() {
    console.log("[Tropo hangs up  ] ...");
}

function reject() {
    console.log("[Tropo rejects   ] ...");
}

function redirect(destination) {
    // Check it is a SIP number as only SIP is supported here
    // https://www.tropo.com/docs/scripting/redirect
    if (!destination.match(/^sip\:/)) {
        console.log("[      WARNING   ] ... only SIP destinations are allowed for redirect! please check your code.");

        // Let's continue even though that will certainly fail on Tropo runtime
    }

    console.log("[Tropo redirects ] ... to " + destination);
}

function say(message) {
    console.log("[Tropo says      ] " + message);
}

function wait(millisec) {
    console.log("[Tropo waits     ] ... for " + millisec + " milliseconds");
}

function call(destination) {
    console.log("[Tropo calls     ] " + destination);

    var newcall = {};
    newcall.name = "(" + destination + ")";
    newcall.value = {};
    newcall.value.say = function (message) {
        say(newcall.name + ", " + message);
    };
    newcall.hangup = function (message) {
        console.log("[Tropo hangs up  ] " + newcall.name + " ...");
    };
    return newcall;
}

function transfer(destination, options) {
    console.log("[Tropo transfers ] ... to " + destination);

    // Mimics a successful call transfer
    var event = {
        name: 'transfer',
        value: {
            calledID: destination,
            channel: 'VOICE'
            // ,callerID: options.callerID || currentCall.calledID,
        },
        duration: 10
    };

    // IF script as an onChoice event handlers, call it
    if (options && options.onSuccess) {
        if (typeof options.onSuccess === "function") {
            options.onSuccess(event);
            return event;
        }

        console.log("[      WARNING   ] ... options.onSuccess should be a function, please check your code.");
        // Let's continue and return an event, even though that was certainly the first intention
    }

    return event;
}

function log(entry) {
    console.log("[      LOG       ] " + entry);
}

function ask(message, options) {
    console.log("[Tropo asks      ] " + message);

    // Check format 
    if (!options.choices || (typeof options.choices !== "string")) {
        console.log("[      ERROR   ] ... no choice options ");
        return;
    }

    // [TODO] ask for real input or default choice
    var choice;
    if (options.choices === "[ANY]") {
        choice = "A";
    }

    // Parse choices: NUMBER
    //  - [DIGITS]
    //  - [1 DIGIT]
    //  - [5 DIGITS]
    //  - [7-10 DIGITS]

    if (!choice && options.choices.match(/DIGIT/)) {
        if (options.choices === "[DIGITS]") {
            choice = 12345;
        }
        else {
            if (options.choices === "[1 DIGIT]") {
                choice = 1;
            }
            else {
                // extract min / max number of digits either [DIGITS], [5 DIGITS] or [7-10 DIGITS]
                var match = options.choices.match(/\[(\d*)(?:-(\d*))?\sDIGITS\]/);
                if (!match) {
                    console.log("[      WARNING   ] DIGITS pattern not recognized, aborting");
                    return;
                }

                var len = parseInt(match[1]);
                choice = Math.pow(10, len) - 1;
            }
        }
    }


    // Parse choices: VALUES
    //   > sales (1, sales), support (2, support)
    //   > sales( 1, sales), support( 2, support)
    //   > sales(1, sales), support(2, support)
    //   > sales, support
    //   > sales,support
    // RegExp *
    if (!choice) {
        //var match = options.choices.match(/^([0-9a-zA-Z]+)(\s?\(.*?\))?(?:\,\s?)?/);
        var regexp = /^([0-9a-zA-Z\s]+)(\s*\(.*?\))?(?:\,\s*)?/;
        var match = options.choices.match(regexp);
        if (!match) {
            console.log("[      ERROR     ] choices pattern not recognized, aborting...");
            throw "choices pattern not recognized";
            return;
        }

        // Make a default choice by selecting first option among offe    possibilities
        choice = match[1].trim();

        // add extra checks 
        if (CHECK_CHOICES_PATTERN) {
            var pattern = options.choices.substring(match[0].length);
            while (true) {
                match = pattern.match(regexp);
                if (!match) {
                    console.log("[      ERROR     ] choices pattern not recognized, aborting...");
                    throw "choices pattern not recognized";
                    return;
                }
                pattern = pattern.substring(match[0].length);
                if (pattern === "") {
                    break;
                }
            }
        }
    }

    console.log("[User  chooses   ] ... choice: " + choice);
    var event = {
        name: 'choice',
        value: choice
    };
    event.onTimeout = function (handler) {
        if (event.name === "timeout") {
            handler();
        }
    };
    event.onBadChoice = function (handler) {
        if (event.name === "badChoice") {
            handler();
        }
    };
    event.onHangup = function (handler) {
        if (event.name === "hangup") {
            handler();
        }
    };
    event.onError = function (handler) {
        if (event.name === "error") {
            handler();
        }
    };
    event.onChoice = function (chosen, handler) {
        if ((event.name === "choice") && (event.value === chosen)) {
            handler();
        }
    };

    // IF script as an onChoice event handlers, call it
    if (options.onChoice) {
        if (typeof options.onChoice === "function") {
            options.onChoice(event);
            return event;
        }

        console.log("[      WARNING   ] ... options.onChoice should be a function, please check your code.");
        // Let's continue and return an event, even though that was certainly the first intention
    }

    // IF script as an onEvent event handlers, call it
    if (options.onEvent) {
        if (typeof options.onEvent === "function") {
            options.onEvent(event);
            return event;
        }

        console.log("[      WARNING   ] ... options.onEvent should be a function, please check your code.");
        // Let's continue and return an event, even though that was certainly the first intention
    }

    // ELSE return current choice
    return event;
}

function record(message, options) {
    var event = {
        name: "record",
        recordURI: "audio.wav"
    };
    return event;
}



// 
// Main: loads the specified script
//
try {
    var script = args.script;
    if (!script) {
        console.log("no script specified\n");
        help();
        process.exit(1);
    }
    if (script.match(/emulator\.js/)) {
        console.log("cannot run against myself! please run command with a Tropo script.");
        process.exit(1);        
    }

    global.answer = answer;
    global.ask = ask;
    global.call = call;
    global.currentCall = currentCall;
    global.hangup = hangup;
    global.log = log;
    global.record = record;
    global.redirect = redirect;
    global.reject = reject;
    global.say = say;
    global.transfer = transfer;
    global.wait = wait;

    var basedir = process.cwd();
    require(basedir + "/" + script);
    console.log("ALL GOOD !!!");
    process.exit(0);
}
catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
        console.log("script not found: " + script);
        process.exit(1);
    }

    if (err.name === "SyntaxError") {
        console.log("SyntaxError: Invalid or unexpected token\n");
        console.log(err.stack.substring(0, err.stack.search("SyntaxError")));
        process.exit(1);
    }

    console.log(err.message);
    process.exit(1);
}