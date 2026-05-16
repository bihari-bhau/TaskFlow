# TaskFlow — Team Task Manager

A full-stack team task management application with JWT authentication, role-based access control (Admin/Member), Kanban board, and analytics dashboard.

**Deployed with: Supabase (PostgreSQL) + Railway (hosting)**

## Live Demo
- **Frontend:** `https://vibrant-inspiration-production-f24a.up.railway.app`
- **Backend API:** *(Your Railway backend URL)*
- **Swagger Docs:** *(Your Railway backend URL)*`/docs`

---

## Tech Stack

| Layer      | Technology                                         |
|------------|-----------------------------------------------------|
| Frontend   | React 18, TypeScript, React Router v6, Recharts     |
| Backend    | FastAPI (Python 3.11), SQLAlchemy ORM               |
| Database   | Supabase (PostgreSQL) — SQLite for local dev        |
| Auth       | JWT (python-jose) + bcrypt (passlib)                |
| Hosting    | Railway (backend + frontend via Docker + Nginx)     |

---

## Features

- **Auth:** Signup / Login with JWT tokens (7-day expiry), bcrypt password hashing
- **Projects:** Create projects (creator = Admin), invite members by email, delete projects
- **Tasks:** Title, Description, Due Date, Priority, Assignee, Status (Kanban board)
- **RBAC:** Admins manage everything; Members update only their assigned task status
- **Dashboard:** Stats cards, completion rate (pie chart), tasks per user (bar chart), overdue alerts

---

## Default Seed Credentials

When first deployed, the database is seeded with demo accounts:

| Role   | Email                | Password   |
|--------|----------------------|------------|
| Admin  | admin@taskflow.io    | admin123   |
| Member | member@taskflow.io   | member123  |
| Member | dev@taskflow.io      | dev123     |

---

## Local Development (Without Docker)

The backend uses **SQLite by default** — no database needed locally.

### Backend
```bash
# From the project root directory
py -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r backend/requirements.txt

# Run from the backend directory
cd backend
uvicorn main:app --reload --port 8000
```
- API running at: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- `taskflow.db` SQLite file auto-created on first run

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
- App running at: http://localhost:3000

### Or with Docker Compose
```bash
docker-compose up --build
```

---

## Deployment — Railway

Both frontend and backend are deployed as separate Railway services using Docker.

### Backend Service

**Railway Settings:**
- **Root Directory:** `backend`
- **Builder:** Dockerfile
- **Start Command:** `bash start.sh` *(shell script needed so Railway's `$PORT` variable is properly expanded)*

**Environment Variables to set in Railway:**
```
DATABASE_URL  = postgresql://postgres:YOUR-PASSWORD@db.XXXX.supabase.co:5432/postgres
SECRET_KEY    = (generate a long random string)
ALLOWED_ORIGINS = https://your-frontend.up.railway.app
```

---

### Frontend Service

**Railway Settings:**
- **Root Directory:** `frontend`
- **Builder:** Dockerfile

**Environment Variables to set in Railway:**
```
REACT_APP_API_URL = https://your-backend.up.railway.app/api
```

> **Note:** The frontend uses runtime environment injection via `docker-entrypoint.sh`.
> At container startup, `window.__REACT_APP_API_URL` is written into `env-config.js`
> so the API URL can be changed without rebuilding the Docker image.

---

### Step-by-Step Railway Deployment

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
3. Add two services: one for `backend`, one for `frontend`
4. Set Root Directory and environment variables for each service (see above)
5. Railway auto-builds and deploys on every `git push`

---

## Environment Variables Reference

### Backend
| Variable          | Description                                    | Local Default             |
|-------------------|------------------------------------------------|---------------------------|
| `DATABASE_URL`    | Supabase PostgreSQL connection URI             | `sqlite:///./taskflow.db` |
| `SECRET_KEY`      | JWT signing secret (32+ chars, keep private)  | Dev fallback (change!)    |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs | `http://localhost:3000`   |

### Frontend
| Variable              | Description                      | Local Default                    |
|-----------------------|----------------------------------|----------------------------------|
| `REACT_APP_API_URL`   | Backend API base URL             | `http://localhost:8000/api`      |

---

## API Endpoints

### Auth
| Method | Endpoint         | Auth | Description            |
|--------|------------------|------|------------------------|
| POST   | /api/auth/signup | No   | Register new user      |
| POST   | /api/auth/login  | No   | Login, returns JWT     |
| GET    | /api/auth/me     | JWT  | Get current user       |

### Projects
| Method | Endpoint                          | Role  | Description            |
|--------|-----------------------------------|-------|------------------------|
| GET    | /api/projects                     | JWT   | List my projects       |
| POST   | /api/projects                     | JWT   | Create project         |
| GET    | /api/projects/{id}                | JWT   | Get project + members  |
| PUT    | /api/projects/{id}                | Admin | Update project         |
| DELETE | /api/projects/{id}                | Admin | Delete project         |
| POST   | /api/projects/{id}/members        | Admin | Add member by email    |
| DELETE | /api/projects/{id}/members/{uid}  | Admin | Remove member          |

### Tasks
| Method | Endpoint                           | Role         | Description              |
|--------|------------------------------------|--------------|--------------------------|
| GET    | /api/tasks/projects/{id}/tasks     | JWT          | List tasks (RBAC)        |
| POST   | /api/tasks/projects/{id}/tasks     | Admin        | Create task              |
| GET    | /api/tasks/{id}                    | JWT          | Get task                 |
| PUT    | /api/tasks/{id}                    | Admin/Owner  | Update task              |
| DELETE | /api/tasks/{id}                    | Admin        | Delete task              |

### Dashboard
| Method | Endpoint        | Auth | Description        |
|--------|-----------------|------|--------------------|
| GET    | /api/dashboard  | JWT  | Aggregated stats   |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── database.py          # SQLAlchemy — Supabase/PostgreSQL or SQLite
│   ├── models.py            # User, Project, ProjectMember, Task
│   ├── schemas.py           # Pydantic v2 validation schemas
│   ├── auth_utils.py        # JWT + bcrypt + get_current_user dependency
│   ├── seed.py              # Seeds demo users, projects, and tasks
│   ├── start.sh             # Railway startup script (handles $PORT expansion)
│   ├── routers/
│   │   ├── auth.py          # Signup, Login, Me
│   │   ├── projects.py      # Project CRUD + member management
│   │   ├── tasks.py         # Task CRUD with RBAC enforcement
│   │   └── dashboard.py     # Analytics aggregation
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml         # Railway deployment config
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routes + auth guards
│   │   ├── AuthContext.tsx   # JWT auth state (localStorage)
│   │   ├── api.ts            # Axios + JWT interceptor + runtime API URL
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Dark design system
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── ProjectDetailPage.tsx
│   │   └── components/
│   │       └── Layout.tsx
│   ├── docker-entrypoint.sh  # Injects REACT_APP_API_URL at container runtime
│   ├── nginx.conf            # Nginx config with React Router + dynamic $PORT
│   ├── .env.production       # Production API URL (build-time fallback)
│   ├── Dockerfile
│   └── railway.toml          # Railway deployment config
│
├── scripts/
│   └── test_login.py         # Quick API smoke test
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## RBAC Matrix

| Action                    | Admin | Member |
|---------------------------|-------|--------|
| Create/delete project     | ✅    | ❌     |
| Add/remove members        | ✅    | ❌     |
| Create/delete tasks       | ✅    | ❌     |
| View all project tasks    | ✅    | ❌     |
| View own assigned tasks   | ✅    | ✅     |
| Update task (all fields)  | ✅    | ❌     |
| Update task status only   | ✅    | ✅     |

---

## Recent Changes

- **Railway deployment** replaces Render as the hosting platform
- **Dynamic `$PORT` support** — Nginx and uvicorn both read Railway's injected `$PORT` at runtime
- **Runtime API URL injection** — `docker-entrypoint.sh` writes `window.__REACT_APP_API_URL` into `env-config.js` at container startup so the backend URL can be changed without rebuilding
- **CORS fix** — `ALLOWED_ORIGINS` env variable replaces hardcoded `"*"` to support `allow_credentials=True`
- **Import fix** — Backend modules use relative imports (not `backend.*`) to work correctly inside Docker
- **Seed credentials updated** — Demo accounts now use `@taskflow.io` emails

---

## Author

**Shubham Singh**
- GitHub: [github.com/bihari-bhau](https://github.com/bihari-bhau)
- LinkedIn: [linkedin.com/in/biharibhau](https://linkedin.com/in/biharibhau)
