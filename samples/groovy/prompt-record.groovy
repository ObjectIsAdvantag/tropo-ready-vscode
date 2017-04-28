/*
 * Copyright (c) 2009 - 2015 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// using ask with record
// --------------------------------------------


await(1000) // wait for 1 second. PLEASE USE await in Groovy
log("This is a log demo")
log("Incoming call info [state:" + currentCall.state() + ", callerID:" + currentCall.callerID + ", callerName:" + currentCall.callerName + "]")

def event=ask("http://example.com/beep.wav where are you heading?",
   [attempts:3, record:true, beep:true, silenceTimeout: 3, maxTime:30, timeout:20.03456789,
    onRecord: {event-> say("you said " + event.recordURI );},
    choices:"1st Floor (first, house wares, 1), 2nd Floor (second, bed and bath, 2), 3rd Floor (third, sporting goods, 3)", 
    onChoice: {event->
      event.onChoice( "1st Floor", { say("Your destination is 1st Floor") } );
      event.onChoice( "2nd Floor", { say("Your destination is 2nd Floor") } );
      event.onChoice( "3rd Floor", { say("Your destination is 3rd Floor") } ); 
    }, 
    onBadChoice: { say("I can not recognize you. Please input again."); }, 
    onTimeout: { say("wait input time out"); }, 
    onHangup: { log(">>>>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<"); }, 
    onError: { say("You have an error!"); },
    onEvent: {event->
      if(event.name!="hangup"){ say("inner callback got triggered by event " + event.name);}
      event.onError( { say("You have an error!") } );
      event.onTimeout( { say("Wait input time out") } );
      event.onHangup( { log(">>>>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<") } );
      event.onChoice( "1st Floor", { say("Your destination is 1st Floor") } );
      event.onChoice( "2nd Floor", { say("Your destination is 2nd Floor") } );
      event.onChoice( "3rd Floor", { say("Your destination is 3rd Floor") } ); 
      event.onBadChoice( { say("I can not recognize you. Please input again. ") } ); 
      event.onRecord( {recordEvent-> say("you said " + recordEvent.recordURI );});
    }
  ]
);

if(event.name!="hangup"){
  say("run outer call back for event [" + event.name +"," + event.value +"]");
  event.onError( { say("You have an error!") } );
  event.onTimeout( { say("wait input time out") } );
  event.onChoice( "1st Floor", { say("Your destination is 1st Floor") } );
  event.onChoice( "2nd Floor", { say("Your destination is 2nd Floor") } );
  event.onChoice( "3rd Floor", { say("Your destination is 3rd Floor") } ); 
  event.onBadChoice( { say("I can not recognize you") } ); 
  event.onRecord( {recordEvent-> say("you said " + recordEvent.recordURI );});
  say("Thanks for testing Groovy on the Tropo platform");
}
else{
  log(">>>>>>>>>>>>>>>Disconnected by the peer!<<<<<<<<<<<<<<<<<");
}