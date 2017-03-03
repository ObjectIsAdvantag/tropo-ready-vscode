/*
 * Copyright (c) 2009 - 2015 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// demonstrating transfer to a SIP URI
// --------------------------------------------

call(toNumber);

say("transferring to ");

var ncall = transfer("sip:ObjectIsAdvantag@sip2sip.info", 30000);

log("Successfully transferred");
