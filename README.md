<p align="center">
  <img src="public/icons/icon-192.svg" width="80" alt="Servr Dash Logo" />
</p>

<h1 align="center">Servr Dash</h1>

<p align="center">
  <strong>Self-hosted server dashboard for your homelab</strong><br/>
  SSH monitoring · GPU stats · Docker · Plex · Radarr · Sonarr
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa" alt="PWA" />
</p>

---

## Features

### Server Monitoring
- Real-time **CPU, GPU, RAM, Disk & Network** metrics via SSH
- Live-updating charts (Recharts)
- Process list with CPU/RAM usage
- OS info, uptime, hostname
- Multi-server support with connection pooling

### Docker Management
- **Container** list with start/stop/restart/remove
- Live container **logs** with auto-scroll
- Container **stats** (CPU, RAM, Network, Block I/O)
- **Image** management (list, remove)
- **Stack** overview (Docker Compose)

### Plex Media Server
- OAuth login via Plex PIN auth (no token copy-paste)
- **Library overview** with item counts
- **Active streams** with transcode/direct play info, progress, bandwidth
- Server status & version

### Radarr (Movies)
- Full **movie library** with poster grid (adjustable sizes)
- **Add movies** with TMDB trending suggestions & search
- Movie detail page with metadata, file info, action buttons
- **Edit movies** — change quality profile, availability, path, monitoring
- **Manual search** — browse & grab individual releases from indexers
- **Download queue** with progress, ETA, quality info
- **Calendar** — upcoming cinema, digital & physical releases

### Sonarr (TV Series)
- Full **series library** with poster grid (adjustable sizes)
- **Add series** with TMDB trending suggestions & search
- Series detail with **season/episode accordion**, per-episode status
- **Edit series** — change quality profile, series type, season folders, path
- **Per-episode manual search** — popup modal to browse & grab releases
- **Manual search** — browse & grab releases per series
- **Download queue** with episode info, progress & ETA
- **Calendar** — upcoming episodes for next 14 days

### TMDB Integration
- **Trending, Popular & Upcoming** suggestions when adding movies/series
- Poster grid with ratings, titles, year
- Click to auto-search in Radarr/Sonarr
- German language results
- Configurable via free TMDB API key

### Dashboard
- Aggregated overview from **all services** on one page
- Service health status (Server, Plex, Radarr, Sonarr, Downloads)
- Active Plex streams
- Server CPU/GPU/RAM/Disk mini-bars
- Media library stats (movies, series, episodes, total storage)
- Download queue summary
- Upcoming releases (next 7 days)

### Settings
- Add/edit/remove SSH servers via UI (no config file editing)
- Plex OAuth login button
- Radarr & Sonarr URL + API key configuration
- TMDB API key for trending suggestions
- User management (add/remove users, admin/user roles)

### General
- **Authentication** — JWT-based with bcrypt password hashing, admin/user roles
- **PWA** — installable on mobile, offline-capable service worker
- **Dark theme** — glassmorphism UI with glow effects
- **Responsive** — optimized for desktop, tablet & mobile
- **Docker-ready** — single container, ~350MB image

---

## Quick Start

### Docker Compose (recommended)

```yaml
services:
  servr-dash:
    build: .
    container_name: servr-dash
    network_mode: host
    volumes:
      - servr-config:/app/config
      - ~/.ssh:/home/nextjs/.ssh:ro
    environment:
      - PORT=3060
      - AUTH_SECRET=your-random-secret-here
      - TZ=Europe/Berlin
    restart: unless-stopped

volumes:
  servr-config:
```

```bash
docker compose up -d
```

Open `http://<your-ip>:3060` — create your admin account on first visit.

### Build from Source

```bash
git clone https://github.com/gottschalkfelix4-source/servr-dash.git
cd servr-dash
npm install
npm run build
npm start
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Web server port |
| `AUTH_SECRET` | `servr-dash-default...` | JWT signing secret (**change this!**) |
| `SECURE_COOKIES` | `true` | Set to `false` for HTTP-only access (no SSL) |
| `TZ` | `UTC` | Timezone for calendar/schedule display |

### Setup via UI

All services are configured through the **Settings** page (`/settings`):

1. **SSH Servers** — Add host, port, username, password or SSH key path
2. **Plex** — Click "Mit Plex anmelden" for OAuth login
3. **Radarr** — Enter URL + API key (from Radarr Settings General)
4. **Sonarr** — Enter URL + API key (from Sonarr Settings General)
5. **TMDB** — Enter free API Read Access Token from themoviedb.org

### Docker Volumes

| Mount | Purpose |
|-------|---------|
| `/app/config` | Persistent config (servers, users, tokens) |
| `/home/nextjs/.ssh` | SSH keys for server connections (read-only) |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **SSH:** ssh2 (Node.js)
- **Auth:** jose (JWT) + bcryptjs
- **Data Fetching:** SWR
- **Icons:** Lucide React

---

## License

MIT
