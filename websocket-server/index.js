/* © 2020 Envision Digital. All Rights Reserved. */

const WebSocket = require("ws");

const wss = new WebSocket.Server({
  host: "10.0.0.2",
  port: process.env.PORT
});

wss.on("connection", (ws) => {
  console.log("websocket server is connected");
  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      client.send(message);
    });
    console.log(message);
  });
});