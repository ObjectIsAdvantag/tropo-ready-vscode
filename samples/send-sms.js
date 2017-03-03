/*
 * Copyright (c) 2017 Tropo, now part of Cisco
 * Released under the MIT license. See the file LICENSE
 * for the complete license
 */

// --------------------------------------------
// demonstrating sending a SMS to a phone number
// leverages the Tropo API Keys (Token URL) with query parameters
// https://www.tropo.com/docs/scripting/quickstarts/making-call/passing-parameters
// --------------------------------------------
call(toNumber, { network: "SMS" });
say(msg);
