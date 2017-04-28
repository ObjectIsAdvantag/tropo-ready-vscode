// --------------------------------------------
// collect digits
// See http://www.tropo.com for more info
// --------------------------------------------

answer();

var result = ask("Hello.  Please enter any number", { choices: "[DIGITS]" });

if (result.name == 'choice') { say("Great, you said " + result.value) };

hangup();
