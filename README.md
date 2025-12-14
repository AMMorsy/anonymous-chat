🕶️ Anon-Chat

Anon-Chat is a minimalist, terminal-style anonymous chat application built with Node.js + Socket.IO.
Users interact entirely through slash commands (/create, /join, /help) in a retro terminal UI.

No accounts. No tracking. No persistence.
Rooms exist in memory (DEV mode) and vanish on restart.

✨ Features

🔐 Anonymous by default (auto-generated handles)

🖥 Terminal-style web UI

💬 Real-time chat via WebSockets (Socket.IO)

🏗 In-memory room system (DEV mode)

⚡ Zero database required

🌍 Works behind Nginx + Cloudflare

🔁 Hot-reload friendly with PM2

🧠 How It Works
User Flow

User opens the site

Socket connects automatically

User types commands:

/create <roomname>

/join <roomcode>

Messages are broadcast in real time

Rooms live in memory only

🧪 Supported Commands
Command	Description
/help	Show available commands
/create <roomname>	Create a new chat room
/join <roomcode>	Join an existing room
/leave	Leave current room
<message>	Send message to room
🏗 Tech Stack
Backend

Node.js

TypeScript

Express

Socket.IO

PM2 (process manager)

Frontend

Vanilla HTML / CSS / JS

Terminal-style UI

No framework, no build step

Infrastructure

Nginx (reverse proxy)

Cloudflare (DNS + SSL)

HTTPS enforced

UFW firewall

📁 Project Structure
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
├── dist/                # compiled output
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

🚀 Running Locally
1️⃣ Install dependencies
npm install

2️⃣ Build backend
npm run build

3️⃣ Start with PM2
pm2 start dist/server/_core/index.js --name anon-chat

4️⃣ Open in browser
http://localhost:3000

🌐 Production Deployment
Nginx (example)
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

Firewall (UFW)
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

🔧 DEV Mode Notes

Rooms are in-memory only

Server restart clears all rooms

No database required

Ideal for:

Prototyping

Demos

Hackathons

Temporary anonymous chats

Database integration can be added later (Postgres / Redis / SQLite)

🔒 Security Notes

No authentication

No cookies

No tracking

No message persistence

Anonymous by design

⚠️ Not suitable for sensitive or regulated data

📸 UI Preview
[SYSTEM] Socket connected
[SYSTEM] Type /help

/create test
[SYSTEM] Room created: test-4K2F
[SYSTEM] Joined room

anon-x92k: hello world

🧭 Roadmap (Optional)

 Persistent rooms (Redis / DB)

 Room expiration timers

 Rate limiting

 Private rooms

 Read-only spectators

 Admin moderation commands

🧑‍💻 Author

Built by Mohamed (Kottab.ai)
Terminal mindset. Minimalism. Control.

📄 License

MIT — use it, fork it, break it, rebuild it.
