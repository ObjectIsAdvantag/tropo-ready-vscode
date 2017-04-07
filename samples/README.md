# Tropo Ready Samples

These samples started from a copy of [Tropo Javascript Samples](https://github.com/tropo/tropo-samples/tree/master/javascript)
enhanced with :
- declarations for local variables to make debugging more convenient (ie, introspection of variables),
- enhanced loops waiting for the hangup event (see [17-collectmoredigits](17-collectmoredigits))
- extra outbound samples ([send-sms](send-sms.js), [bidirectional-sms](bidirectional-sms.js), [transfer-outbound](transfer-outbound.js))

This folder also contains scrips contributed to enhance the [emulator project](https://github.com/ObjectIsAdvantag/tropo-emulator-js):
- [trequest](trequest): contains examples using the request library for Tropo


## Quick start

Run `make` to see the samples executed by the Tropo emulator.

Tip: look at the [Makefile](Makefile) for examples of Inbound/Outbound & Voice/SMS Tropo calls made via the emulator.

```shell
> tropoready tutorial/13-callerid-reject.js --callerID "4075551111"
> tropoready bidirectional-sms.js --outbound --parameters "toNumber=+33678007800" 
> tropoready bidirectional-sms.js --SMS --initialText "yes"
> tropoready send-sms.js --outbound --parameters "toNumber=+33678007800" "msg=hello friends"
> tropoready request/speak-my-github-stars.js --callerID "+336780078XX"
> tropoready request/text-my-github-stars.js --SMS --initialText "CiscoDevNet awesome-ciscospark"
```
