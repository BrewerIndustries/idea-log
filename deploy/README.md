# Deploying Idea Log to the jarvis server

Two environments live on the jarvis server (`dan@100.102.159.57`), each a **git
checkout** authenticated with a read-only deploy key (`~/.ssh/idea-log-deploy`, via
the `github-idea-log` host alias in `~/.ssh/config`):

| Env  | Branch | Path                 | Port | Service        | URL                              |
| ---- | ------ | -------------------- | ---- | -------------- | -------------------------------- |
| MAIN | `main` | `/opt/idea-log`      | 4660 | `idea-log`     | https://idea-log.dabrewer.dev    |
| DEV  | `dev`  | `/opt/idea-log-dev`  | 4670 | `idea-log-dev` | https://idea-log.dev.dabrewer.dev |

Each has its own `.env` (separate `JARVIS_TOKEN`) and an isolated SQLite DB at
`data/ideas.db`. `.env`, `data/`, `node_modules/`, and `.next/` are gitignored and
live only on the server.

**Environment banner:** DEV's `.env` must include `JARVIS_ENV=dev` so the UI shows
its amber "DEV ENVIRONMENT — NOT PRODUCTION" strip and `[DEV]` tab title. **MAIN must
leave `JARVIS_ENV` unset.** The prod unit also sets `PORT=4660`, which hard-suppresses
the banner regardless of `.env`. Read at request time (`force-dynamic`), so editing
`.env` + `systemctl restart <service>` is enough — no rebuild needed for the banner.

## Workflow

Work on `dev`, deploy to DEV, and **promote to MAIN only via a PR the user approves**
(never fast-forward or `git push origin dev:main`):

```bash
git push origin dev
ssh dan@100.102.159.57 /opt/idea-log-dev/deploy/update-dev.sh   # → DEV (:4670)

# once a dev→main PR is approved + merged:
ssh dan@100.102.159.57 /opt/idea-log/deploy/update.sh           # → MAIN (:4660)
```

Each `update*.sh` does `git pull --ff-only && npm ci && npm run build && systemctl restart <service>`.

## First-time setup (per environment)

```bash
# 1. deploy key (once): generate on the server, add the PUBLIC key to the repo as a
#    read-only deploy key, and add an SSH host alias `github-idea-log`.
ssh-keygen -t ed25519 -f ~/.ssh/idea-log-deploy -N "" -C "idea-log deploy (jarvis-server)"
#    ~/.ssh/config:
#      Host github-idea-log
#        HostName github.com
#        User git
#        IdentityFile ~/.ssh/idea-log-deploy
#        IdentitiesOnly yes

# 2. clone (main → /opt/idea-log, dev → /opt/idea-log-dev)
sudo mkdir -p /opt/idea-log && sudo chown dan:dan /opt/idea-log
git clone -b main github-idea-log:BrewerIndustries/idea-log.git /opt/idea-log

# 3. configure + build  (better-sqlite3 compiles native — build ON the server)
cd /opt/idea-log
cp .env.example .env            # set JARVIS_TOKEN=$(openssl rand -hex 24); dev also adds JARVIS_ENV=dev
npm ci
npm run build

# 4. service
sudo cp deploy/idea-log.service /etc/systemd/system/      # (-dev variant for dev)
sudo systemctl daemon-reload
sudo systemctl enable --now idea-log
sudo systemctl status idea-log
```

## Reverse proxy (nginx)

Add a `server{}` block per env to `/etc/nginx/sites-available/dabrewer.dev`, then
`sudo nginx -t && sudo systemctl reload nginx`:

```nginx
server {
    server_name idea-log.dabrewer.dev;          # dev: idea-log.dev.dabrewer.dev
    location / { proxy_pass http://localhost:4660; }   # dev: 4670
    # … the file's shared TLS / proxy-header includes …
}
```

DNS: the dev subdomain is covered by the `*.dev.dabrewer.dev` wildcard. The prod
subdomain `idea-log.dabrewer.dev` needs a Cloudflare A record → `100.102.159.57`
(DNS-only). Wildcard Let's Encrypt certs already cover TLS for both.

The SQLite DB lives at `/opt/idea-log/data/ideas.db` — included in the server backups.
