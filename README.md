
# Peer Drop

Encrypted browser-to-browser file sharing with resumable transfers.

Peer Drop is a peer-to-peer file transfer app that uses **WebRTC** to send files directly between browsers. The server is only used for signaling — file data never passes through it.

---

## Features

* End-to-end encrypted P2P file transfer
* Direct browser-to-browser communication (WebRTC DataChannels)
* Resumable uploads for interrupted transfers
* Custom reliability layer (TCP-style chunking + ACKs)
* Horizontally scalable WebSocket signaling server

---

## Tech Stack

**Frontend**

* Next.js
* WebRTC
* WebSockets

**Backend**

* Node.js
* Express
* WebSocket signaling server

---

## How It Works

1. Two peers connect through a signaling server (WebSockets)
2. A WebRTC connection is established between browsers
3. Files are split into chunks and sent over a DataChannel
4. Receiver acknowledges chunks; missing ones are retransmitted
5. Transfers can resume if the connection drops

---

## Local Setup

### Clone the repo

```bash
git clone https://github.com/yourusername/peer-drop.git
cd peer-drop
```

### Run signaling server

```bash
cd server
npm install
npm run dev
```

### Run client

```bash
cd client
npm install
npm run dev
```

Client runs on `http://localhost:3000`

---

## Security

* File data is encrypted via WebRTC (DTLS)
* Server only handles connection signaling, not file storage


