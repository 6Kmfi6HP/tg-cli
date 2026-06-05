# 🚀 tg-cli

> Full-featured Telegram CLI powered by GramJS — read, send, forward, search, and manage chats from the terminal.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/tg-cli.svg)](https://www.npmjs.com/package/tg-cli)

## ✨ Features

- 📖 **Read** — Browse chats, read messages, search globally or per-chat
- ✉️ **Send** — Send text, files, reply to messages
- 🔄 **Forward** — True message forwarding with original sender preserved + album support
- 🔍 **Search** — Full-text search across all chats or within a specific chat
- 📌 **Manage** — Pin/unpin, mute/unmute, delete, edit messages
- 👥 **Members** — List group members and admins
- 📥 **Download** — Save media from messages to disk
- 🔄 **Sync** — Export chat history to local markdown files
- 📊 **JSON output** — Every command supports `--json` for scripting/automation

## 📦 Installation

```bash
npm install -g tg-cli
```

## 🚀 Quick Start

```bash
# 1. Authenticate (interactive — enter your API ID, Hash, phone number)
tg auth

# 2. Verify login
tg check

# 3. List your chats
tg chats

# 4. Read messages from a chat
tg read "My Group"

# 5. Send a message
tg send "My Group" "Hello from the terminal! 👋"
```

## 📖 Command Reference

### Auth & Info

| Command | Description |
|---------|-------------|
| `tg auth` | Authenticate with Telegram (interactive setup) |
| `tg check` | Verify session and show logged-in account |
| `tg whoami` | Show current user info |

### Read

| Command | Description |
|---------|-------------|
| `tg chats` | List all chats (`-n`, `--type`, `--json`) |
| `tg read <chat>` | Read messages (`-n`, `--since`, `--until`, `--json`) |
| `tg search <query>` | Search messages (`--chat`, `--all`, `-n`, `--json`) |
| `tg inbox` | Show unread messages summary |

### Write

| Command | Description |
|---------|-------------|
| `tg send <target> <message>` | Send a message |
| `tg reply <chat> <msg-id> <message>` | Reply to a specific message |
| `tg send-file <target> <file>` | Send a file (`--caption`) |
| `tg forward <source> <target> <ids>` | Forward messages (preserves sender, supports albums) |
| `tg edit <chat> <msg-id> <new-text>` | Edit a message |
| `tg delete <chat> <ids>` | Delete messages (comma-separated IDs) |

### Manage

| Command | Description |
|---------|-------------|
| `tg pin <chat> <msg-id>` | Pin a message |
| `tg unpin <chat> <msg-id>` | Unpin a message |
| `tg mute <chat>` | Mute chat notifications |
| `tg unmute <chat>` | Unmute chat notifications |

### Info

| Command | Description |
|---------|-------------|
| `tg info <chat>` | Show chat details (members count, about, etc.) |
| `tg contact <user>` | Show user details (bio, phone, etc.) |
| `tg members <group>` | List group members (`-n`, `--json`) |
| `tg admins <group>` | List group admins |
| `tg groups` | List all groups (`--admin` for admin-only) |

### Media & Utilities

| Command | Description |
|---------|-------------|
| `tg download <chat> <msg-id> <output>` | Download media from a message |
| `tg sync` | Sync chat history to markdown files (`--days`, `--chat`, `--output`) |

## ⚙️ Configuration

Config is stored at `~/.config/tg/config.json5`:

```json5
{
  apiId: 12345678,
  apiHash: 'your-api-hash-here',
  sessionString: '1BQAN...',  // Auto-saved after auth
}
```

### Getting API Credentials

1. Go to [my.telegram.org](https://my.telegram.org)
2. Log in with your phone number
3. Go to "API Development Tools"
4. Create a new application
5. Copy the `api_id` and `api_hash`

## 🤖 AI Agent Integration

`tg-cli` is designed for AI agent automation:

```bash
# Read last 20 messages as JSON
tg read "My Channel" -n 20 --json

# Forward messages between channels
tg forward "source-channel" "target-channel" 123,456,789

# Send file with caption
tg send-file "target" /path/to/file.pdf --caption "Monthly report"
```

### Example: Cron Job for Channel Monitoring

```bash
# Read latest messages
MESSAGES=$(tg read "news-channel" -n 10 --json)

# Process with your AI agent...
```

## 🛠️ Development

```bash
# Clone
git clone https://github.com/6Kmfi6HP/tg-cli.git
cd tg-cli

# Install deps
npm install

# Build
npm run build

# Dev mode (watch)
npm run dev

# Test locally
node dist/index.js --help
```

## 📝 License

MIT © [gyue](https://github.com/6Kmfi6HP)
