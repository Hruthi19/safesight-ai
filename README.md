# SafeSight AI

Real-time hazard detection and incident reporting platform for warehouses, retail, and healthcare environments. Upload images or use a live webcam feed — YOLOv8 detects hazards, incidents are created automatically, and the dashboard updates in real time.

## Features

- **Hazard detection** — YOLOv8 object detection plus supplemental fire/smoke color analysis
- **Incident workflow** — Detect → review → assign → resolve with full status history
- **Live dashboard** — Socket.IO pushes new incidents and status changes instantly
- **Live feed** — Webcam scanning and video upload with automatic clip extraction
- **Analytics** — Trend charts, severity breakdown, and hazard heatmaps (D3)
- **Export** — Download incident data as CSV or PDF
- **RBAC** — Worker, manager, and admin roles with permission-based actions
- **Notifications** — Slack webhook and email alerts (optional, env-configured)

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL  │
│  React/Vite │◀────│   Express   │     └──────────────┘
└──────┬──────┘     │  Socket.IO  │────▶┌──────────────┐
       │            │   BullMQ      │     │    Redis     │
       │            └──────┬───────┘     └──────────────┘
       │                   │
       ▼                   ▼ webhook
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  ML Service │────▶│    MinIO    │     │  Detections  │
│ YOLOv8/FastAPI    │  (S3 store) │     │  + Incidents │
└─────────────┘     └─────────────┘     └──────────────┘
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, React Router, Socket.IO client, D3, jsPDF |
| Backend | Node.js, Express, PostgreSQL, Redis, BullMQ, Socket.IO |
| ML Service | Python, FastAPI, YOLOv8 (Ultralytics), OpenCV |
| Storage | MinIO (S3-compatible), PostgreSQL |
| DevOps | Docker Compose, GitHub Actions CI |

## Quick Start

**Requirements:** Docker Desktop, ~8 GB free RAM

```bash
git clone <repo-url>
cd safesight-ai
docker compose up --build
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| ML API docs | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |

**Demo login:**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin1` | `admin123` |
| Manager | `manager1` | `manager123` |
| Worker | `worker1` | `worker123` |

## App Pages

| Route | Description |
|-------|-------------|
| `/` | Incident dashboard with live updates |
| `/live` | Webcam scan + video upload |
| `/detect` | Image upload with bounding-box overlay |
| `/report` | Manual incident reporting |
| `/analytics` | Charts, heatmaps, CSV/PDF export |
| `/incidents/:id` | Incident detail + workflow timeline |

## Project Structure

```
safesight-ai/
├── frontend/          # React dashboard
├── backend/           # Express API, jobs, webhooks
│   └── db/            # SQL schema + migrations
├── ml-service/        # YOLOv8 detection API
├── docker-compose.yml
└── .github/workflows/ # CI pipeline
```

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# ML service
cd ml-service && pip install -r requirements.txt pytest httpx2
export PYTHONPATH=$(pwd) && pytest -v
```

CI runs lint, tests, and Docker builds on every push to `main` and `develop`.

## Environment Variables

Key variables are set in `docker-compose.yml`. For custom setups:

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | backend, ml | PostgreSQL connection string |
| `VITE_API_URL` | frontend | Backend API URL |
| `VITE_ML_SERVICE_URL` | frontend | ML service URL |
| `VITE_WS_URL` | frontend | Socket.IO URL |
| `ML_WEBHOOK_KEY` | backend, ml | Shared secret for ML → backend webhooks |
| `SLACK_WEBHOOK_URL` | backend | Optional Slack alerts |
| `NOTIFY_EMAIL` | backend | Optional email alerts |


## License

MIT 
