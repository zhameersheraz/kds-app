# Permanent deploy to Render.com (click-by-click)

This gives you a permanent URL like `https://kds-app-xyz.onrender.com` that
runs 24/7. No commands, no terminal. Once deployed, you can close Kali forever
or shut down your laptop - the URL still works.

**Free tier details:**
- $0/month for the web service (spins down after 15 min of no traffic)
- $0.25/month for 1GB persistent storage (so your SQLite database survives)
  Total: ~$0.25/month, basically free. Only charged for hours the service is
  actively running.
- First request after a 15-min idle takes 30-60s to wake up. After that it's instant.

**What you need (all free):**
- GitHub account (we use it to host the code so Render can pull it)
- Render account (sign up via GitHub in one click)

That's it. No credit card needed (Render only asks for one if you upgrade).

---

## Step 1 - Create a free GitHub account (skip if you have one)

Open <https://github.com/signup> in your browser:
- Enter your email, password, username
- Solve the puzzle
- Verify your email

Done. You should land on your GitHub dashboard.

---

## Step 2 - Create a new private repository

While still in GitHub:
1. Click the **+** icon in the top-right corner
2. Click **New repository**
3. Fill in:
   - **Repository name**: `kds-app`
   - **Description** (optional): `Kitchen Display System`
   - **Visibility**: **Private** (important - keeps your code private)
   - **DO NOT** check "Add a README file"
   - **DO NOT** check "Add .gitignore"
   - **DO NOT** choose a license
4. Click **Create repository**

GitHub will show you a "Quick setup" page. Leave that page open - you'll need the URL from it in the next step. It looks like:
```
https://github.com/YOUR_USERNAME/kds-app.git
```

---

## Step 3 - Push the code from Kali

In Kali terminal:

```bash
cd ~/projects/kds-app

# Configure git (one-time, use your actual GitHub email and name)
git config --global user.email "your-github-email@example.com"
git config --global user.name  "Your Name"

# Initialize the repo and commit
git init
git add .
git commit -m "kds initial"

# Set the default branch to main
git branch -M main

# Connect to GitHub - use YOUR_USERNAME in this URL
git remote add origin https://github.com/YOUR_USERNAME/kds-app.git

# Push the code
git push -u origin main
```

When prompted for username: type your GitHub username.
When prompted for password: GitHub no longer accepts passwords. You need a Personal Access Token:

**To create a token (only if git asks):**
1. Go to <https://github.com/settings/tokens> (while logged in to GitHub)
2. Click **Generate new token** -> **Generate new token (classic)**
3. Note: `kali-deploy`
4. Expiration: pick `No expiration` (or 90 days)
5. Scopes: check **repo** (full)
6. Click **Generate token** at the bottom
7. COPY the token (long string of random characters)
8. Paste it as the password when git prompts

After a few seconds you should see:
```
Writing objects: 100% (...)
* [new branch]      main -> main
```

---

## Step 4 - Sign up for Render

1. Open <https://render.com> in your browser
2. Click **Get Started for Free**
3. Click **Sign up with GitHub** (easiest)
4. Authorize Render to access your GitHub repos

You're now on the Render dashboard. Don't create anything yet - first we need to add a config file that tells Render exactly what to do.

---

## Step 5 - Add a Render config file

In Kali terminal:

```bash
cat > ~/projects/kds-app/render.yaml <<'EOF'
services:
  - type: web
    name: kds-app
    runtime: node
    plan: free
    buildCommand: cd server && npm install && cd ../client && npm install && npm run build
    startCommand: cd server && node index.js
    envVars:
      - key: NODE_VERSION
        value: 20
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 4000
    disk:
      name: kds-data
      mountPath: /opt/render/project/src/server/data
      sizeGB: 1
EOF

cd ~/projects/kds-app
git add render.yaml
git commit -m "add render config"
git push
```

---

## Step 6 - Create the Render service

Back in the Render dashboard in your browser:

1. Click **New +** in the top blue bar
2. Click **Web Service** (NOT "Static Site", NOT "Worker")
3. Under "Git Account" you should see your GitHub account - if not, click **Configure account** and authorize
4. Find the `kds-app` repo in the list -> click **Connect** next to it

Now fill in the form (Render should auto-fill some):
- **Name**: `kds-app` (this becomes your URL: `kds-app.onrender.com`)
- **Region**: **Singapore** (closest to Philippines, fastest)
- **Branch**: `main`
- **Runtime**: **Node**
- **Build Command**: leave what's there (the render.yaml has the right one)
- **Start Command**: leave what's there
- **Plan**: **Free**

Scroll down to **Advanced**:
- **Add Environment Variable**:
  - Key: `JWT_SECRET`  
  - Value: type any long random string, e.g. `my-super-secret-key-zham-2026`
- **Add Disk**:
  - Name: `kds-data`
  - Mount Path: `/opt/render/project/src/server/data`
  - Size: `1` GB

Click **Create Web Service**.

Render will start deploying. You can watch the logs live.

---

## Step 7 - Wait for the first deploy (~5 min)

You'll see a page with logs scrolling. You'll know it's done when:

```
==> Your service is live 🎉
```

Your permanent URL is at the top: `https://kds-app.onrender.com`

---

## Step 8 - Verify it works

1. Open `https://kds-app.onrender.com` in any browser
2. Should see the KDS login page (no ngrok warning, clean)
3. Sign in as `zham` / `zham123`
4. Done - your app is permanently online

---

## Step 9 - Share with anyone

Send that URL to anyone: friends, classmates, professor. They open it, sign in,
use the app. Real-time sync works across the internet because Render provides
HTTPS and Socket.IO upgrades automatically to WSS (secure WebSocket).

You can now:
- Close Kali
- Shut down your laptop
- Go to sleep

The URL still works. Render keeps it running.

---

## After deploy - managing it

To see your live services: <https://dashboard.render.com>

To update the code:
1. Edit files in `~/projects/kds-app/`
2. Run: `cd ~/projects/kds-app && git add . && git commit -m "msg" && git push`
3. Render auto-detects the push and redeploys (~2-3 min)
4. New version is live

To delete the service (stop spending money): dashboard -> service -> Settings -> Delete Service

---

## Troubleshooting

**"Application failed to respond"**: Build succeeded but app crashed. Check the logs in the Render dashboard. Most common cause: SQLite file path issues. Make sure the disk mount path in the YAML is exactly `/opt/render/project/src/server/data`.

**"build timed out"**: Build ran more than 15 min. Unusual, shouldn't happen for this size. Check Render logs.

**URL gives "Service Unavailable"**: Service is starting up (cold start). Wait 30-60 seconds, refresh.

**Changes don't show up after `git push`**: Render's auto-deploy only works if the service is set to "Auto-Deploy: On". Check Service Settings -> Auto-Deploy.

---

## Other permanent free options (if Render doesn't work for you)

**Glitch.com**: Faster setup, but project sleeps after 5 min idle. Same general process - import from GitHub.

**Vercel + Vercel Postgres**: Vercel for the frontend, but its serverless functions don't fit this app well (Socket.IO needs persistent connections). NOT recommended for this project.

**fly.io**: Free tier with 3 shared VMs that don't sleep. Requires a credit card on file (charged $0 for free usage). More setup than Render.