Anon-Chat

Anon-Chat is a lightweight, terminal-style anonymous chat application built with Node.js and Socket.IO.
Users interact with the system exclusively through typed commands inside a browser-based terminal interface.

The project is intentionally minimal, transparent, and easy to reason about.

What This Project Is

Anon-Chat provides:

Anonymous real-time chat

No accounts

No cookies

No sessions

No database (development mode)

No frontend framework

Rooms exist in memory and are destroyed when the server restarts.

How Users Interact

There are no buttons and no UI controls.
Everything happens through typed commands.

Available Commands
/help
/create <room-name>
/join <room-code>
/leave

Command Behavior

/help
Displays all available commands and usage.

/create <room-name>
Creates a new chat room and automatically joins it.

/join <room-code>
Joins an existing room using its code.

/leave
Leaves the current room.

Any other text is treated as a chat message and sent to the active room.

Architecture Overview

Anon-Chat is split into two independent parts.

Backend

Node.js

TypeScript

Express

Socket.IO

PM2 (process manager)

Responsibilities:

Room lifecycle

Message broadcasting

Command parsing

WebSocket handling

Frontend

Plain HTML

Plain CSS

Vanilla JavaScript

No build step

No framework

Responsibilities:

Terminal-style interface

Command input

WebSocket client

Project Structure
anon-chat/
├── client/
│   ├── index.html
│   └── client.js
│
├── server/
│   ├── socket.ts
│   └── _core/
│       └── index.ts
│
├── dist/                  # Compiled backend output
├── package.json
├── tsconfig.json
└── README.md

Local Development
Install Dependencies
npm install

Build Backend
npm run build

Start Server
pm2 start dist/server/_core/index.js --name anon-chat

Access Application
http://localhost:3000

Production Deployment
Nginx Reverse Proxy
server {
    listen 80;
    server_name chat.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

Firewall Rules
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

Development Mode Behavior

Rooms are stored in memory

No database is required

All rooms disappear on restart

Designed for fast iteration and testing

This behavior is intentional.

Security Notes

Anon-Chat does not provide:

Authentication

Authorization

Persistence

Encryption at rest

It is not intended for sensitive data.

Example Session
[SYSTEM] Connected
[SYSTEM] Type /help

/create demo
[SYSTEM] Room created: demo-A7F2

anon-x93k: hello world

Extending the Project

Possible next steps:

Redis-backed rooms

Persistent chat history

Room moderation

Private rooms

Multi-server scaling

Tor / Onion deployment

Author

AHMED MORSY


License

AMMorsy License
