import express from "express";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map<string, WebSocket[]>();

wss.on("connection", function connection(ws: any) {
  ws.on("message", function (data: any) {
    const message = JSON.parse(data.toString());

    if (message.type === "join") {
      console.log(`Client joined room: ${message.roomId}`);
      if (!rooms.has(message.roomId)) {
        rooms.set(message.roomId, []);
      }

      rooms.get(message.roomId)!.push(ws);
      console.log(
        `Total clients in room ${message.roomId}: ${
          rooms.get(message.roomId)!.length
        }`
      );
    }

    if (message.type === "offer") {
      console.log("offer received");

      rooms.get(message.roomId)!.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: "offer",
              offer: message.offer,
              roomId: message.roomId,
            })
          );
        }
      });
      console.log("offer forwarded");
    }
    if (message.type === "answer") {
      console.log("answer received");
      rooms.get(message.roomId)!.forEach((client) => {
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

      rooms.get(message.roomId)!.forEach((client) => {
        if (client !== ws && client.readyState === 1) {
          client.send(
            JSON.stringify({ type: "candidate", candidate: message.candidate })
          );
        }
      });
      console.log("candidate forwarded");
    }
  });

  ws.on("close", () => {
    rooms.forEach((client, roomid) => {
      rooms.set(
        roomid,
        client.filter((c) => c !== ws)
      );
      console.log(`Client disconnected from room: ${roomid}`);
    });
  });
});

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(3000);
