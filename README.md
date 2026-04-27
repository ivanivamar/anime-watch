# anime-watch

Personal anime streaming app. Two processes:

- `backend/` — Express API on :3000
- `frontend/` — Angular dev server on :4200

## Quick start

```bash
# Backend
cd backend
cp .env.example .env   # edit MEDIA_ROOT and DB_PATH
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

## Requirements

- Node 20+
- ffmpeg in PATH (for metadata extraction)
