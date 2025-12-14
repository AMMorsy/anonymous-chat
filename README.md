Anon-Chat

Anon-Chat is a lightweight, terminal-style anonymous chat application built with Node.js and Socket.IO.
Users interact exclusively through typed commands inside a browser-based terminal interface.

The system is designed for simplicity, anonymity, and fast deployment.

Overview

Anon-Chat provides real-time chat rooms without user accounts, cookies, or persistent storage.
Rooms exist only in memory (development mode) and are destroyed when the server restarts.

The project intentionally avoids frameworks on the frontend and databases on the backend to keep the architecture transparent and easy to extend.

Core Features

Anonymous chat (no login, no identity)

Terminal-style web interface

Real-time messaging via WebSockets

Command-based interaction model

In-memory room management (DEV mode)

Works behind Nginx and Cloudflare

HTTPS-ready

PM2 process management

User Commands

Users interact with the system using slash commands.

/help
/create <room-name>
/join <room-code>
/leave

Command Behavior

/help
Displays available commands and usage.

/create <room-name>
Creates a new chat room and automatically joins it.

/join <room-code>
Joins an existing room by its code.

/leave
Leaves the current room.

Any other text
Is sent as a message to the current room.

Technology Stack
Backend

Node.js

TypeScript

Express

Socket.IO

PM2

Frontend

HTML

CSS

Vanilla JavaScript

No framework, no build step

Infrastructure

Nginx (reverse proxy)

Cloudflare (DNS, SSL)

HTTPS enforced

UFW firewall

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
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

Local Development
Install dependencies
npm install

Build the backend
npm run build

Start the server
pm2 start dist/server/_core/index.js --name anon-chat

Access the app
http://localhost:3000

Production Deployment
Nginx Configuration Example
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

Development Mode Notes

Rooms are stored in memory only

No database is required

All rooms are destroyed on restart

Designed for prototyping and controlled environments

This behavior is intentional and simplifies early development.

Security Considerations

No authentication

No cookies

No session storage

No message persistence

No user tracking

This project is not intended for sensitive or regulated data.

Example Session
[SYSTEM] Socket connected
[SYSTEM] Type /help

/create demo
[SYSTEM] Room created: demo-A7F2

anon-x93k: hello world

Extension Ideas

Persistent rooms (Redis / SQL)

Room expiration

Moderation commands

Private rooms

Multi-server scaling

End-to-end encryption

Tor / Onion service

Author

Built by Ahmed 

License

AMMorsy License
