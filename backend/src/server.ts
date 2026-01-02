import express from "express";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function (message) {
    console.log("received: %s", message);
  });

  ws.send("hello client");
});

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);
