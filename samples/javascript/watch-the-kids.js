/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// Demonstrates outbound calls

// https://www.tropo.com/docs/scripting/call
//call(toNumber, {network: "SMS"});

// uncomment to start a phone call to the specified number
// note: if  a mobile number is specified, this will only work from a Tropo production environment (billed account)
call(toNumber);

say("Hey Steve, it's time to pick the girls !!!");
