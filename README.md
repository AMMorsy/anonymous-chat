<h1>Anon-Chat</h1>

<p>
Anon-Chat is a lightweight, terminal-style anonymous chat application built with Node.js and Socket.IO.
Users interact with the system entirely through typed commands inside a browser-based terminal interface.
</p>

<hr />

<h2>What This Project Is</h2>

<p>
Anon-Chat provides real-time anonymous chat with no accounts, no cookies, no sessions, and no frontend framework.
Rooms exist in memory and are destroyed when the server restarts.
</p>

<ul>
  <li>No authentication</li>
  <li>No database (development mode)</li>
  <li>No persistence</li>
  <li>No UI buttons</li>
</ul>

<hr />

<h2>User Interaction</h2>

<p>
The interface is a terminal emulator. Users type commands to interact with the system.
</p>

<h3>Available Commands</h3>

<pre>
/help
/create &lt;room-name&gt;
/join &lt;room-code&gt;
/leave
</pre>

<h3>Command Behavior</h3>

<p><strong>/help</strong><br />
Displays available commands.</p>

<p><strong>/create &lt;room-name&gt;</strong><br />
Creates a new chat room and automatically joins it.</p>

<p><strong>/join &lt;room-code&gt;</strong><br />
Joins an existing room.</p>

<p><strong>/leave</strong><br />
Leaves the current room.</p>

<p>
Any other input is treated as a chat message.
</p>

<hr />

<h2>Architecture</h2>

<h3>Backend</h3>

<ul>
  <li>Node.js</li>
  <li>TypeScript</li>
  <li>Express</li>
  <li>Socket.IO</li>
  <li>PM2</li>
</ul>

<p>
Handles rooms, messages, WebSocket connections, and command parsing.
</p>

<h3>Frontend</h3>

<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>Vanilla JavaScript</li>
</ul>

<p>
Provides a terminal-style interface with no build step.
</p>

<hr />

<h2>Project Structure</h2>

<pre>
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
├── dist/
├── package.json
├── tsconfig.json
└── README.md
</pre>

<hr />

<h2>Local Development</h2>

<h3>Install</h3>

<pre>npm install</pre>

<h3>Build</h3>

<pre>npm run build</pre>

<h3>Run</h3>

<pre>pm2 start dist/server/_core/index.js --name anon-chat</pre>

<h3>Open</h3>

<pre>http://localhost:3000</pre>

<hr />

<h2>Production Deployment</h2>

<h3>Nginx Reverse Proxy</h3>

<pre>
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
</pre>

<h3>Firewall</h3>

<pre>
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
</pre>

<hr />

<h2>Development Mode Notes</h2>

<ul>
  <li>Rooms stored in memory</li>
  <li>No persistence</li>
  <li>Restart wipes all data</li>
</ul>

<hr />

<h2>Security Notice</h2>

<p>
This project is not designed for sensitive data. There is no encryption at rest,
no authentication, and no access control.
</p>

<hr />

<h2>Example Session</h2>

<pre>
[SYSTEM] Connected
[SYSTEM] Type /help

/create demo
[SYSTEM] Room created: demo-A7F2

anon-x93k: hello world
</pre>

<hr />

<h2>Author</h2>

<p>
AHMED MORSY<br />
</p>

<hr />

<h2>License</h2>

<p>AMMorsy License</p>
