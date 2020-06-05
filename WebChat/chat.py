#!/bin/env python
from app import create_app, socketio
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

app = create_app(debug=True)

if __name__ == '__main__':
    # socketio.run(app)
    http_server = WSGIServer(('0.0.0.0',5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
