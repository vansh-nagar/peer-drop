import express from "express";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", function (data) {
    const message = JSON.parse(data.toString());
    if (message.type === "offer") {
      console.log("offer received");
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(JSON.stringify({ type: "offer", offer: message.offer }));
        }
      });
      console.log("offer forwarded");
    }
    if (message.type === "answer") {
      console.log("answer received");
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(
            JSON.stringify({ type: "answer", answer: message.answer })
          );
        }
      });
      console.log("answer forwarded");
    }
    if (message.type === "candidate") {
      console.log("candidate received");

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(
            JSON.stringify({ type: "candidate", candidate: message.candidate })
          );
        }
      });
      console.log("candidate forwarded");
    }
  });
});

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);
