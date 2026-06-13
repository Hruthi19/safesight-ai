# Deploying SafeSight AI (Simple & Free Options)

This project runs as **4 app services + 3 data services**. The easiest path is Docker Compose on your own machine. For sharing a demo online, use a free VPS and run the same Compose stack there.

## What you need running

| Service    | Purpose                          |
|-----------|-----------------------------------|
| frontend  | React dashboard (port 5173)       |
| backend   | API + Socket.IO (port 3000)       |
| ml-service| YOLOv8 hazard detection (8000)    |
| postgres  | Database                          |
| redis     | Job queue                         |
| minio     | Image/video storage               |

---

## Option 1 — Local Docker Compose (recommended, 100% free)

Best for development, demos on your laptop, and interviews.

```bash
# From project root
docker compose up --build
```

Open:
- App: http://localhost:5173
- ML API docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001 (admin / password123)

Login: `admin1` / `admin123`

**Requirements:** Docker Desktop, ~8 GB RAM free (ML service is the heaviest part).

---

## Option 2 — Free VPS + Docker Compose (free public demo)

Run the exact same stack on a small cloud VM so others can visit it via a public IP.

**Good free VPS providers:**
- [Oracle Cloud Always Free](https://www.oracle.com/cloud/free/) — 4 ARM cores / 24 GB RAM (best fit for ML)
- [Google Cloud](https://cloud.google.com/free) — $300 trial credit
- [AWS Free Tier](https://aws.amazon.com/free/) — 12-month EC2 t2.micro (may be tight on RAM for ML)

**Steps:**

1. Create a VM (Ubuntu 22.04+, at least 4 GB RAM).
2. Install Docker: https://docs.docker.com/engine/install/ubuntu/
3. Clone the repo and run:
   ```bash
   docker compose up --build -d
   ```
4. Open firewall ports: `5173`, `3000`, `8000` (or only `5173` if you proxy everything through the frontend).
5. Share `http://<your-vm-ip>:5173`

> Tip: For a cleaner URL, put [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) in front — free HTTPS, no port forwarding needed.

---

## Option 3 — Run services individually (no Docker)

Useful if Docker is slow on your machine.

**Terminal 1 — database & cache (still easiest via Docker):**
```bash
docker compose up postgres redis minio -d
```

**Terminal 2 — backend:**
```bash
cd backend && npm install && npm start
```

**Terminal 3 — ML service:**
```bash
cd ml-service && pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu
export DATABASE_URL=postgresql://safesight:safesight@localhost:5433/safesight
uvicorn app.api:app --reload --port 8000
```

**Terminal 4 — frontend:**
```bash
cd frontend && npm install && npm run dev
```

---

## Option 4 — Split hosting (partial cloud, mostly free)

If you only want the **dashboard online** and can run ML locally:

| Piece     | Free host              | Notes                                      |
|----------|------------------------|--------------------------------------------|
| Postgres | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Free Postgres tier                         |
| Backend  | [Render](https://render.com) free web service | Sleep after inactivity                     |
| Frontend | [Vercel](https://vercel.com) or [Netlify](https://netlify.com) | Static/Vite deploy                         |
| ML       | Keep on your machine   | Point `VITE_ML_SERVICE_URL` to localhost or a tunnel |

This works for showing the **incident dashboard** but live detection needs the ML service reachable — Option 1 or 2 is simpler for the full product demo.

---

## What we intentionally skipped

Kubernetes, Terraform, and AWS EKS add complexity and cost. They make sense for large production teams, not for learning or portfolio demos. Docker Compose (local or on one VPS) covers this project well.

---

## Quick troubleshooting

| Problem | Fix |
|---------|-----|
| ML container slow to start | First run downloads YOLO weights (~6 MB); allow 1–2 min |
| Disk full during build | `docker system prune -a` and ensure 15+ GB free |
| Frontend can't reach API | Check `VITE_API_URL=http://localhost:3000` in docker-compose |
| Port already in use | Stop other services or change ports in docker-compose.yml |
