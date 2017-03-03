# Tropo Ready Samples

These samples are a copy of [Tropo Javascript Samples](https://github.com/tropo/tropo-samples/tree/master/javascript)
enhanced with :
- declarations for local variables to make debugging more convenient (ie, introspection of variables),
- enhanced loops waiting for the hangup event (see 17-collectmoredigits)
- extra outbound samples (send-sms.js, bidirectional-sms.js, transfer-outbound.js)

This set of samples will be extended with scripts contributed to enhanced the emulator project.

## Quick start

Run `make` to see the samples executed by the Tropo emulator.

Tip: look at the [Makefile](Makefile) for examples of Inbound/Outbound & Voice/SMS Tropo calls made via the emulator.

```shell
node ../lib/emulator.js tutorial/13-callerid-reject.js --callerID "4075551111"
node ../lib/emulator.js bidirectional-sms.js --outbound --parameters "toNumber=+33678007800" 
node ../lib/emulator.js bidirectional-sms.js --SMS --initialText "yes"
node ../lib/emulator.js send-sms.js --outbound --parameters "toNumber=+33678007800" "msg=hello friends"
```
