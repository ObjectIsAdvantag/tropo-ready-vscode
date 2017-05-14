/*
 * Copyright (c) 2009 - 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// This demo is detailled here: https://usecases.tropo.com/inbound-self-service-ivr/hotel


var newMonth = "";
var newDay = "";
var newYear = "";
var howManyNights = "";

ask("Welcome to Tropo Hotel.  Can I help you with a new or existing reservation?", {
    	choices:"new, existing, agent, something else",
    	attempts: 3,
    	onChoice: function(event) {
        	reservationChoice(event);
    	}
    });

function reservationChoice(event){
	if (event.value == "existing"){
    	ask("You chose existing reservation.  We see from your phone number your booked for checkin on December 19, 2015.  Would you like to cancel this reservation?", {
    	choices:"yes, no",
    	attempts: 3,
    	onChoice: function(event) {
        	cancelReservation(event);
    	}
    	});
	} else if (event.value == "new"){
    	ask("Alright new resevations.  Which month would you like this reservation for?", {
    	choices:"january, february, march, april, may, june, july, august, september, october, november, december",
    	attempts: 3,
    	onChoice: function(event) {
        	newMonthReservation(event);
    	}
    	});
	} else {
    	say("Thanks.  We are now transferring you to an agent");
    	transfer("+19803338415");
	}

}

function cancelReservation(event){
	if (event.value == "yes"){
   	say("Alright.  Your reservation has been cancelled.  Thanks for calling.");
	} else {
    	say("Alright.  We are now transferring you to an agent who can help you make changes to your itinerary.");
    	transfer("+19803338415");
	}

}

function newMonthReservation(event){
    	newMonth = event.value;
    	ask("Aright which date in " + event.value + " would you like to check in?  Please enter in the number on your keypad.", {
    	choices:"[1-2 DIGITS]",
    	attempts: 3,
    	mode:"dtmf",
    	onChoice: function(event) {
        	newDayReservation(event);
    	}
	});

}

function newDayReservation(event){
    	newDay = event.value;
    	ask("Alright " + newMonth + " " + event.value + ".  Please enter in the year of your stay in the keypad.", {
    	choices:"[4 DIGITS]",
    	attempts: 3,
    	mode:"dtmf",
    	onChoice: function(event) {
        	newYearReservation(event);
    	}
	});

}

function newYearReservation(event){
    	newYear = event.value;
    	ask("So how many nights would you like to stay for when you check in on " + newMonth + " " + newDay + ", " + newYear + "?  Please enter in the number on your keypad", {
    	choices:"[1-2 DIGITS]",
    	attempts: 3,
    	mode:"dtmf",
    	onChoice: function(event) {
        	newAmtDaysReservation(event);
    	}
	});

}

function newAmtDaysReservation(event){
    	howManyNights = event.value;
    	ask("Thanks! So we have you staying with us for " + event.value + " nights on " + newMonth + " " + newDay + ", " + newYear + ".  Is this correct?", {
    	choices:"yes, no",
    	attempts: 3,
    	onChoice: function(event) {
        	newConfirmRes(event);
    	}
	});

}

function newConfirmRes(event){
    	if(event.value == "yes"){
        	say("Great!  We have you booked for " + howManyNights + " nights on " + newMonth + " " + newDay + ", " + newYear + ".  Thanks for calling!");
    	} else {
        	ask("Alright let's try this again.  Which month would you like this reseration for?", {
          	choices:"january, february, march, april, may, june, july, august, september, october, november, december",
          	attempts: 3,
          	onChoice: function(event) {
            	newMonthReservation(event);
         	}
       	});
    	}
}
