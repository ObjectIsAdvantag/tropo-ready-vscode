/*
 * Copyright (c) 2009 - 2015 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// Using ask with recording
// --------------------------------------------

wait(1000)
// wait for 1 second
log("this is a log demo")

log("Incoming call info [state:" + currentCall.state() +
    ",callerID:" + currentCall.callerID + ",calledID:" + currentCall.calledID +
    ",callerName:" + currentCall.callerName + ",calledName:" +
    currentCall.calledName)
//var event=record("please say something");
var event = ask("http://example.com/beep.wav where are you heading?",
    {
        attempts: 3,
        record: true,
        beep: true,
        silenceTimeout: 3,
        maxTime: 30,
        timeout: 20.03456789,
        //onSilenceTimeout:function(){say( "silence timeout")},
        onRecord: function (event) {
            say("you said " + event.recordURI);
        },
        choices: "1st Floor (first, house wares, 1), 2nd Floor (second, bed and bath, 2), 3rd Floor (third, sporting goods, 3)",
        onChoice: function (event) {
            event.onChoice("1st Floor",
                function () {
                    say("Your destination is 1st Floor")
                });
            event.onChoice("2nd Floor",
                function () {
                    say("Your destination is 2nd Floor")
                });
            event.onChoice("3rd Floor",
                function () {
                    say("Your destination is 3rd Floor")
                });
        },
        onBadChoice: function () {
            say("I can not recognize you. Please input again.");
        },
        onTimeout: function () {
            say("wait input time out");
        },
        onHangup: function () {
            log(">>>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<");
        },
        onError: function () {
            say("You have an error!");
        },
        onEvent: function (event) {
            if (event.name != "hangup") {
                say("inner callback got triggered by event " + event.name);
            }
            event.onError(function () {
                say("You have an error! ")
            });
            event.onTimeout(function () {
                say("wait input time out")
            });
            event.onHangup(function () {
                log(">>>>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<")
            });
            event.onChoice("1st Floor",
                function () {
                    say("Your destination is 1st Floor")
                });
            event.onChoice("2nd Floor",
                function () {
                    say("Your destination is 2nd Floor")
                });
            event.onChoice("3rd Floor",
                function () {
                    say("Your destination is 3rd Floor")
                });
            event.onBadChoice(function () {
                say("I can not recognize you. Please input again. ")
            });
            event.onRecord(function (event) {
                say("you said " + event.recordURI);
            });
        }
    }
);

if (event.name != "hangup") {
    say("run outer call back for event [" + event.name + "," + event.value
        + "]");
    event.onError(function () {
        say("You have an error!")
    });
    event.onTimeout(function () {
        say("wait input time out")
    });
    event.onChoice("1st Floor",
        function () {
            say("Your destination is 1st Floor")
        });
    event.onChoice("2nd Floor",
        function () {
            say("Your destination is 2nd Floor")
        });
    event.onChoice("3rd Floor",
        function () {
            say("Your destination is 3rd Floor")
        });
    event.onBadChoice(function () {
        say("I can not recognize you")
    });
    event.onRecord(function (event) {
        say("you said " + event.recordURI);
    });
    say("Thanks for testing Java Script on the Tropo platform");
}
else {
    log(">>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<");
}