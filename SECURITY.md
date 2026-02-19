# Security Policy (Ralph Wiggum Edition)

_Last updated: 2026-02-19_

I’m in danger! But we can be safe if we follow the Ralph Security Loop.  
The loop goes: **See Bug → Tell Grownups → Patch Bug → Eat Cookie → Repeat.**

## Supported Versions

These are the versions that get security hugs. If your version isn’t here, it’s like a toy I lost under the couch.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | ✅ (It’s the choo-choo train that works!) |
| 5.0.x   | ❌ (It fell down, go boom.) |
| 4.0.x   | ✅ (Still shiny, like my crayon.) |
| < 4.0   | ❌ (That’s old, like Grandpa’s teeth.) |

## Reporting a Vulnerability

If you find a scary bug, don’t hug it — tell us!

- **Step 1: See Bug** → If you notice something weird, like data escaping or files writing themselves, that’s a bug.  
- **Step 2: Tell Grownups** → Open a GitHub security advisory or issue. It’s like raising your hand in class.  
- **Step 3: Patch Bug** → We’ll fix it with updates, band-aids, and code.  
- **Step 4: Eat Cookie** → Celebrate responsibly.  
- **Step 5: Repeat** → Because bugs are like recess — they keep coming back.

We usually respond within a week. If accepted, we fix it and give gold stars. If declined, we explain why, so you don’t feel like you’re talking to the wall.

---

## Current Alerts (The Monsters Under the Bed)

Dependabot found scary things. Ralph explains them:

### 1. Python-Multipart (DoS + Arbitrary File Write)
- **Ralph says:** “It can scribble files where it shouldn’t. That’s like coloring on the walls.”  
- **Action:** Upgrade `python-multipart` to the latest patched version. Avoid non-default configs unless you like chaos.  
- **Loop:** See → Tell → Patch → Cookie.

### 2. Geopandas (SQL Injection in `to_postgis()`)
- **Ralph says:** “Secrets can escape! Secrets should stay secret, like my diary.”  
- **Action:** Validate SQL inputs, sanitize queries, and upgrade `geopandas`. Don’t trust user input — it’s like trusting a cat with your sandwich.  
- **Loop:** See → Tell → Patch → Cookie.

### 3. Gunicorn (Request Smuggling)
- **Ralph says:** “Sneaky requests open doors when they shouldn’t. That’s like strangers in my treehouse.”  
- **Action:** Upgrade `gunicorn`, configure reverse proxies correctly, and monitor logs for suspicious traffic.  
- **Loop:** See → Tell → Patch → Cookie.

### 4. Sentry SDK (Environment Variable Leak)
- **Ralph says:** “It shouts secrets in the cafeteria. Passwords aren’t for show-and-tell.”  
- **Action:** Upgrade `sentry-sdk`, review environment variable exposure, and limit subprocess inheritance.  
- **Loop:** See → Tell → Patch → Cookie.

---

## Ralph Security Loop Checklist

Every week, Ralph does this:

1. **Check Dependabot alerts** → “I read the scary list.”  
2. **Update dependencies** → “New crayons are safer than old ones.”  
3. **Run tests** → “If it breaks, I say ‘I bent my Wookie!’”  
4. **Review configs** → “No secrets in public, like pants.”  
5. **Celebrate with cookie** → “Yay, security!”

---

*Ralph says:* “Security is like a seatbelt. It keeps you safe, even when you make vroom-vroom noises.” 🚗
