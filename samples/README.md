# Tropo Ready Samples

These samples started from a copy of [Tropo Samples](https://github.com/tropo/tropo-samples).

The Javascript samples have been enhanced with :
- declarations for local variables to make debugging more convenient (ie, introspection of variables),
- modification of a loop that was leveraging hangup event to break (see [17-collectmoredigits](17-collectmoredigits))
- extra outbound samples ([send-sms](send-sms.js), [bidirectional-sms](bidirectional-sms.js), [transfer-outbound](transfer-outbound.js))
- examples making REST client calls with an [experimental library](https://github.com/ObjectIsAdvantag/tropo-emulator-js#http-client-api-calls): [speak-my-github-stars](request/speak-my-github-stars.js), [live-voting](request/live-voting.js)


## Quick start

Run `make` to see the samples executed by the Tropo emulator.

Tip: look at the [Makefile](Makefile) for examples of Inbound/Outbound & Voice/SMS Tropo calls made via the emulator.

```shell
> tropoready tutorial/13-callerid-reject.js --callerID "4075551111"
> tropoready bidirectional-sms.js --outbound --parameters "toNumber=+33678007800" 
> tropoready bidirectional-sms.js --SMS --initialText "yes"
> tropoready send-sms.js --outbound --parameters "toNumber=+33678007800" "msg=hello friends"
> tropoready request/speak-my-github-stars.js --callerID "+336780078XX"
> tropoready request/text-stars.js --SMS --initialText "CiscoDevNet awesome-ciscospark"
```
