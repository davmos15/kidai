# 🌟 KidAI — Safe AI Companions for Kids

> **Try it now:** [safekidai.netlify.app](https://safekidai.netlify.app)

A free, privacy-first web app where parents set up safe AI chat agents for their children. No accounts, no subscription, no servers — everything lives in your browser.

---

## What it is

KidAI lets you create custom AI "friends" your child can chat with, with parent-controlled safety rails on top of Anthropic (Claude), OpenAI (GPT), or Google Gemini.

- **Parents set everything up once** — PIN, children, agents, safety rules.
- **Kids pick who they want to chat with** from a friendly picker, then chat in a colourful interface designed for them.
- **All data stays on your device** — your API keys, your kids' names, their chat history. KidAI has no backend at all.

---

## Getting started (2 minutes)

1. Go to **[safekidai.netlify.app](https://safekidai.netlify.app)** and click **Parent / Setup**.
2. Follow the 5-step wizard:
   - Choose a **Parent PIN** (keeps kids out of settings)
   - *(Optional)* Paste an **API key** from one of the AI providers — or skip and add it later
   - Add your **children** (name, emoji, optional extra safety per kid)
   - Pick the **AI agents** they can use (Maths Mate, Story Buddy, Science Explorer, etc., or make your own)
3. That's it. Your child taps **I'm a Kid!** from the home screen and starts chatting.

You can always come back to the **Parent Dashboard** (bottom-right of the home screen) to add agents, edit safety rules, view chat history, or export a backup.

---

## What parents can control

### Per-child and global safety rails
- **Reading level** — 7-point slider from age 4 to 16+; sets vocabulary and sentence complexity
- **Content filters** — block links, images, videos, emojis (any combination)
- **Personal info protection** — AI never asks for or repeats surnames, addresses, phone numbers, emails, or school names; phone/email patterns in the child's messages are blocked before they're sent
- **Restricted topics** — violence, adult content, drugs, gambling, politics, horror — toggle categories on/off
- **Custom blocked words** — your own list on top of the defaults
- **Usage limits** — cap messages per day (resets at midnight); show break-reminder nudges every N messages
- **Font size** — kid-facing chat can be small / normal / large / extra-large for early readers

### Per-agent
- **Personality** — write any system prompt, or start from a preset
- **Tutor mode** — agent never gives direct answers; always guides with hints and questions (great for homework)
- **AI provider + model** — any connected provider, any model the provider offers (live-fetched, or type a custom ID)

### Chat history
- View or export a child's full chat history from the dashboard as JSON
- Optionally turn off local storage so chats aren't kept at all

### Backup & restore
- Export your full configuration (with or without API keys) as a JSON file
- Import it on another device or after clearing your browser

---

## Getting AI API keys

You need at least one key to let kids actually chat. All are pay-per-use with no subscription:

| Provider | Where to get a key | Cheapest model | Notes |
|----------|-------------------|----------------|-------|
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com/) | claude-3-5-haiku | ~$0.001 per chat |
| **OpenAI (GPT)** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | gpt-4o-mini | ~$0.001 per chat |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | gemini-2.5-flash | Generous free tier |

> 💡 **Tip:** Gemini has a free tier — a good no-cost way to try KidAI. For most families, a **dedicated key with a monthly spend cap** (all three providers support this in their billing settings) is the safest setup, so a lost or shared device can't rack up charges.

---

## Privacy

- **Zero backend.** KidAI is a static web page. There is no server that stores your data.
- **Your API keys** only ever travel between your browser and the AI provider you chose. They're kept in your browser's `localStorage` and nowhere else.
- **Chat history** is per-device. Nothing is uploaded anywhere.
- **No analytics, no accounts, no cookies** beyond what your browser normally does.

### Important things to know

- If your child uses a different device, chat history doesn't follow them. Configuration can be moved via **Export → Import** in the Parent Dashboard.
- Clearing browser data will erase KidAI's settings — export a backup first if that would hurt.
- API keys stored in localStorage can theoretically be read by anyone with access to the device. Treat the device like you'd treat a saved password.

---

## Frequently asked questions

**Is this really free?**
The app itself is free. The AI API calls cost whatever your provider charges (usually fractions of a cent per chat). You control your own spend by managing your own keys — KidAI never touches money.

**Does it work on a tablet or phone?**
Yes — it's a standard responsive web app. Works in any modern browser.

**Can my child break the safety rules by typing "ignore previous instructions"?**
The app has layered defences: a robust system prompt that names known jailbreak patterns by name, input sanitisation that strips control characters and hidden unicode, and post-response filters. No AI safety system is 100% foolproof, so the app assumes parental supervision rather than replacing it.

**What if the AI says something inappropriate anyway?**
Enable chat history in the Parent Dashboard and review occasionally. You can also add custom blocked words and restrict additional topic categories. If something slips through, report it to the AI provider — they take that feedback seriously.

**Can I use this across multiple devices?**
Right now only via manual export/import. Automatic sync isn't built yet (it would require a server and break the zero-backend design).

---

## Disclaimer

KidAI is a proof-of-concept tool. While it implements multiple layers of content filtering, no AI safety system is perfect. Use it as a supplement to parental supervision, not a replacement. Check in on your child's chats periodically.

---

## For developers

KidAI is open source — [view the code on GitHub](https://github.com/davmos15/kidai).

The stack is React 18 + Vite, no backend. If you want to run it locally:

```bash
git clone https://github.com/davmos15/kidai.git
cd kidai
npm install
npm run dev
```

Build a production bundle with `npm run build`; output lands in `dist/`. `netlify.toml` is pre-configured for Netlify deploys — connect the repo in the Netlify dashboard for automatic builds.

---

Made with care for curious kids everywhere.
