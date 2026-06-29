# AI Video Editor

Turn raw video clips from Dropbox into polished cinematic videos automatically using AI.

## Architecture

```
User enters Dropbox Link
         |
         v
Dropbox API Fetches Clips
         |
         v
Video Analysis AI Agent (OpenCV, MediaPipe, YOLO)
         |
         v
Clip Scoring and Selection
         |
         v
AI Story Generation
         |
         v
Transition Planning
         |
         v
Music Selection
         |
         v
FFmpeg Rendering
         |
         v
Final MP4 Output
```

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Python FastAPI + SQLAlchemy + Celery
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **Video Processing:** FFmpeg + OpenCV + MoviePy
- **AI Analysis:** OpenCV, MediaPipe, YOLO

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.12+ (for local backend dev)
- FFmpeg installed locally

### Using Docker (Recommended)

1. Clone the repo and navigate to the project root:

```bash
cd ai-video-editor
```

2. Create environment files:

```bash
cp backend/.env.example backend/.env
```

3. Edit `backend/.env` and add your Dropbox API credentials:

```
DROPBOX_APP_KEY=your_key
DROPBOX_APP_SECRET=your_secret
DROPBOX_REFRESH_TOKEN=your_refresh_token
```

4. Start all services:

```bash
docker compose up --build
```

5. Access the app:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env  # edit with your credentials
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/create-project` | Create a new editing project |
| POST | `/api/upload-dropbox-link` | Accept and validate a Dropbox folder URL |
| POST | `/api/analyze-clips` | Scan and extract metadata from all video files |
| POST | `/api/generate-video` | Start AI-powered video generation |
| GET | `/api/project-status/{id}` | Get processing progress |
| GET | `/api/download/{filename}` | Download rendered video |
| GET | `/api/preview/{filename}` | Stream/preview video |
| GET | `/api/projects` | List all user projects |
| GET | `/api/health` | Health check |

## Dropbox Setup

1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app with "Full Dropbox" or "App folder" access
3. Generate an access token or configure OAuth
4. Add credentials to `backend/.env`

## AI Analysis Pipeline

Each video clip is analyzed for:

- **Duration, resolution, frame rate** - basic metadata
- **Scene changes** - using histogram difference detection
- **Camera motion** - using optical flow analysis
- **Sharpness/blur** - using Laplacian variance
- **Brightness** - average pixel luminance
- **Quality score** - combination of sharpness, resolution, motion stability
- **Content classification** - wide shot, portrait, dynamic, etc.
- **Emotion/mood estimation** - based on motion and brightness patterns

## Project Structure

```
ai-video-editor/
├── backend/
│   ├── app/
│   │   ├── api/routes/     # FastAPI route handlers
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic validation schemas
│   │   ├── services/       # Business logic services
│   │   │   ├── dropbox_service.py    # Dropbox API integration
│   │   │   ├── analysis_service.py   # Video analysis (OpenCV)
│   │   │   ├── editing_service.py    # AI editing pipeline
│   │   │   ├── music_service.py      # Music selection
│   │   │   ├── rendering_service.py  # FFmpeg rendering
│   │   │   └── storage_service.py    # File management
│   │   └── tasks/          # Background task processing
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/          # Landing, Dashboard, Processing, Preview
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── components/     # Reusable components
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
