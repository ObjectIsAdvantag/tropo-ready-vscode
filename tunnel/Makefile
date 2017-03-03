
all: win

win:
	(start caddy)
	(start ngrok http 8763)

start:
	(caddy &)
	(ngrok http 8763)

stop:
	(pkill caddy)
	(pkill ngrok)