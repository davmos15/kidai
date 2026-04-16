# 🌟 KidAI — Safe AI Companions for Kids

A free, privacy-first web app where parents set up safe AI chat agents for their children. All data stays on the parent's device — no backend, no accounts, no subscription.

---

## ✨ Features

### Parent Dashboard
- 🔒 PIN-protected parent access
- 👨‍👩‍👧 Add multiple children with custom names & avatars
- 🤖 Create custom AI agents or use presets (Maths Mate, Story Buddy, Science Explorer, Homework Helper, Fun Buddy)
- 🛡️ Global safety controls:
  - Block all links & URLs (agents won't send them; any that slip through are non-clickable)
  - Block video & image suggestions
  - Restricted topic categories (Violence, Adult Content, Drugs, Gambling, Politics, Horror) — toggle on/off
  - Custom blocked words/phrases list
  - Max response length control
- 💬 View and export kids' chat history
- 🔑 Connect your own API keys (Anthropic, OpenAI, Gemini)

### Kid Chat UI
- Friendly, colourful interface designed for children
- Per-kid agent assignment (each child only sees their agents)
- Agent switcher if multiple agents are assigned
- Animated typing indicator
- Input filtering — blocked words are caught before sending
- Output filtering — links stripped if blocking is enabled

---

## 🚀 Deploying to Netlify (Free)

### Option 1: Via GitHub (Recommended)

1. Create a new GitHub repo and push this project folder to it
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your repo
4. Set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy** — done!

### Option 2: Drag & Drop

1. Run `npm run build` locally
2. Go to [netlify.com/drop](https://app.netlify.com/drop)
3. Drag the `dist/` folder onto the page
4. Instant deploy — no account needed for a temporary URL

---

## 🔑 Getting API Keys

You need at least one API key to use KidAI. All are pay-per-use (no subscription).

| Provider | Where to Get Key | Cheapest Model | Est. Cost per Chat |
|----------|-----------------|----------------|-------------------|
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com/) | claude-3-haiku | ~$0.001 |
| **OpenAI (GPT)** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | gpt-4o-mini | ~$0.001 |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | gemini-1.5-flash | Free tier available |

> 💡 **Tip:** Google Gemini has a generous free tier — great for getting started at zero cost.

---

## 💾 Data & Privacy

- **All configuration** (API keys, kids, agents, settings) is stored in your browser's `localStorage`
- **API keys** are only sent directly to the respective AI provider when making chat requests — never to any other server
- **Chat history** is stored in `localStorage` (on the device used by the child) if you enable it
- **Nothing is stored on any server** — this app has no backend
- **Exporting chats** downloads a `.json` file to your device

### Important Notes
- If a child uses a different device/browser, chat history won't sync (it's device-local)
- Clearing browser data will erase all settings — export your config if needed
- For multi-device use, you'll need to re-enter settings on each device

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Requires Node.js 18+.

---

## 📁 Project Structure

```
kidai/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Entry point (Kid vs Parent split)
│   │   ├── Setup.jsx            # First-time setup wizard
│   │   ├── ParentDashboard.jsx  # Full parent management UI
│   │   ├── KidSelect.jsx        # Kid chooser screen
│   │   └── KidChat.jsx          # The chat interface kids use
│   ├── utils/
│   │   └── storage.js           # localStorage, AI API calls, safety filtering
│   ├── App.jsx                  # Route management
│   └── index.css                # Global design system
├── netlify.toml                 # Netlify SPA redirect config
└── index.html
```

---

## 🗺️ Roadmap Ideas

- [ ] Agent-picker screen when a kid has multiple agents (currently defaults to first)
- [ ] Per-kid safety setting overrides
- [ ] PIN change from dashboard
- [ ] Config export/import (JSON backup)
- [ ] Voice input for younger kids
- [ ] Reading level setting per agent
- [ ] Session time limits
- [ ] Daily message limits

---

## ⚠️ Disclaimer

KidAI is a proof-of-concept tool. While it implements multiple layers of content filtering, no AI safety system is 100% foolproof. Parents should periodically review chat history and use this as a supplement to, not a replacement for, parental supervision.

---

Made with ❤️ for curious kids everywhere.
