# TaskFlow — Team Task Manager

A full-stack team task management application with JWT authentication, role-based access control (Admin/Member), Kanban board, analytics dashboard, member allocation, and pending task tracking.

**Deployed with: Railway Postgres (PostgreSQL) + Railway (hosting)**

## Live Demo
- **Frontend:** `vibrant-inspiration-production-f24a.up.railway.app`
- **Backend API:** `taskflow-production-8281.up.railway.app`
- **Swagger Docs:** `taskflow-production-8281.up.railway.app/docs`

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18, TypeScript, React Router v6, Recharts         |
| Backend    | FastAPI (Python 3.11), SQLAlchemy ORM                   |
| Database   | Railway Postgres (PostgreSQL) — SQLite for local dev    |
| Auth       | JWT (python-jose) + passlib (pbkdf2_sha256)             |
| Hosting    | Railway (backend + frontend via Docker + Nginx)         |

---

## Features

- **Auth:** Signup / Login with JWT tokens (7-day expiry), secure password hashing
- **Projects:** Create projects (creator = Admin), invite members by email, delete projects
- **Tasks:** Title, Description, Due Date, Priority (Low/Medium/High), Assignee, Status (Kanban)
- **RBAC:** Admins manage everything; Members update only their assigned task status
- **Dashboard:** 6 stat cards, completion rate (pie chart), tasks per member (bar chart), project overview, overdue task table
- **Member Allocation:** Per-project member table with roles, task counts, and load indicators
- **Pending Tasks:** Cross-project pending task list with filters (status, priority, project) and overdue highlights

---

## Seed Credentials

The database is seeded with 23 demo accounts across 5 projects:

### Admin & HR
| Role  | Email                    | Password     | Access              |
|-------|--------------------------|--------------|---------------------|
| Admin | admin@taskflow.io        | admin123     | All 5 projects      |
| HR    | shreya.hr@taskflow.io    | shreya123    | Leviathan (admin)   |

### Dev Teams
| Project    | Email                      | Password       |
|------------|----------------------------|----------------|
| **Talos**  | ankit@taskflow.io          | ankit123       |
|            | satyendra@taskflow.io      | satyendra123   |
|            | saumya@taskflow.io         | saumya123      |
|            | manu@taskflow.io           | manu123        |
|            | shivansh@taskflow.io       | shivansh123    |
| **Valor**  | sumit@taskflow.io          | sumit123       |
|            | priya@taskflow.io          | priya123       |
|            | sneha@taskflow.io          | sneha123       |
|            | rahul@taskflow.io          | rahul123       |
|            | shreyansh@taskflow.io      | shreyansh123   |
| **Atlas**  | dhananjay@taskflow.io      | dhananjay123   |
|            | vaibhav@taskflow.io        | vaibhav123     |
|            | shreya@taskflow.io         | shreya123      |
|            | gaurav@taskflow.io         | gaurav123      |
| **Vindex** | yash@taskflow.io           | yash123        |
|            | madhwan@taskflow.io        | madhwan123     |
|            | mayank@taskflow.io         | mayank123      |
|            | shahnawaz@taskflow.io      | shahnawaz123   |
| **Leviathan** | kanak@taskflow.io       | kanak123       |
|            | shivani@taskflow.io        | shivani123     |
|            | navreet@taskflow.io        | navreet123     |

### Projects Overview
| Project    | Description                                                | Team Size |
|------------|------------------------------------------------------------|-----------|
| Talos      | AI-powered analytics platform for real-time data processing | 6         |
| Valor      | Next-gen mobile banking app with biometric authentication  | 6         |
| Atlas      | Cloud infrastructure management dashboard                  | 5         |
| Vindex     | Enterprise search engine with NLP semantic search          | 5         |
| Leviathan  | HR operations platform — onboarding, payroll, lifecycle    | 4         |

---

## Local Development (Without Docker)

The backend uses **SQLite by default** — no database setup needed locally.

### Backend
```bash
cd backend
py -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- `taskflow.db` SQLite file auto-created on first run

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
- App: http://localhost:3000

### Or with Docker Compose
```bash
docker-compose up --build
```

---

## Deployment — Railway

Both services are deployed as separate Railway services using Docker.

### Backend Service

**Railway Settings:**
- **Root Directory:** `backend`
- **Builder:** Dockerfile
- **Start Command:** `bash start.sh`

**Environment Variables:**
```
DATABASE_URL    = postgresql://postgres:PASSWORD@monorail.proxy.rlwy.net:PORT/railway
SECRET_KEY      = (long random string, 32+ chars)
ALLOWED_ORIGINS = https://vibrant-inspiration-production-f24a.up.railway.app
PORT            = 8000
```

### Frontend Service

**Railway Settings:**
- **Root Directory:** `frontend`
- **Builder:** Dockerfile

**Environment Variables:**
```
REACT_APP_API_URL = https://taskflow-production-8281.up.railway.app/api
```

> **Runtime injection:** `docker-entrypoint.sh` writes `window.__REACT_APP_API_URL` into
> `env-config.js` at container startup — API URL changes don't require a Docker rebuild.

### Step-by-Step Deployment

1. Push code to GitHub
2. Railway → **New Project → Deploy from GitHub Repo**
3. Add two services: `backend` and `frontend`
4. Add a **PostgreSQL** database service (Railway native)
5. Set `DATABASE_URL` on backend using Railway's reference variable: `${{ Postgres.DATABASE_URL }}`
6. Set remaining env vars for each service
7. Railway auto-builds and deploys on every `git push`

---

## Environment Variables Reference

### Backend
| Variable          | Description                                   | Local Default             |
|-------------------|-----------------------------------------------|---------------------------|
| `DATABASE_URL`    | PostgreSQL connection URI                     | `sqlite:///./taskflow.db` |
| `SECRET_KEY`      | JWT signing secret (keep private)             | Dev fallback (change!)    |
| `ALLOWED_ORIGINS` | Comma-separated allowed frontend URLs         | `http://localhost:3000`   |
| `PORT`            | Port uvicorn binds to                         | `8000`                    |

### Frontend
| Variable            | Description               | Local Default               |
|---------------------|---------------------------|-----------------------------|
| `REACT_APP_API_URL` | Backend API base URL      | `http://localhost:8000/api` |

---

## API Endpoints

### Auth
| Method | Endpoint          | Auth | Description        |
|--------|-------------------|------|--------------------|
| POST   | /api/auth/signup  | No   | Register new user  |
| POST   | /api/auth/login   | No   | Login, returns JWT |
| GET    | /api/auth/me      | JWT  | Get current user   |

### Projects
| Method | Endpoint                         | Role  | Description           |
|--------|----------------------------------|-------|-----------------------|
| GET    | /api/projects                    | JWT   | List my projects      |
| POST   | /api/projects                    | JWT   | Create project        |
| GET    | /api/projects/{id}               | JWT   | Get project + members |
| PUT    | /api/projects/{id}               | Admin | Update project        |
| DELETE | /api/projects/{id}               | Admin | Delete project        |
| POST   | /api/projects/{id}/members       | Admin | Add member by email   |
| DELETE | /api/projects/{id}/members/{uid} | Admin | Remove member         |

### Tasks
| Method | Endpoint                       | Role        | Description     |
|--------|--------------------------------|-------------|-----------------|
| GET    | /api/tasks?project_id={id}     | JWT         | List tasks      |
| POST   | /api/tasks/projects/{id}/tasks | Admin       | Create task     |
| GET    | /api/tasks/{id}                | JWT         | Get task        |
| PUT    | /api/tasks/{id}                | Admin/Owner | Update task     |
| DELETE | /api/tasks/{id}                | Admin       | Delete task     |

### Dashboard
| Method | Endpoint        | Auth | Description      |
|--------|-----------------|------|------------------|
| GET    | /api/dashboard  | JWT  | Aggregated stats |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── database.py          # SQLAlchemy — PostgreSQL or SQLite
│   ├── models.py            # User, Project, ProjectMember, Task
│   ├── schemas.py           # Pydantic v2 validation schemas
│   ├── auth_utils.py        # JWT + pbkdf2_sha256 + get_current_user
│   ├── seed.py              # 23 users, 5 projects, 24 tasks
│   ├── start.sh             # Railway startup — handles $PORT expansion
│   ├── routers/
│   │   ├── auth.py          # Signup, Login, Me
│   │   ├── projects.py      # Project CRUD + member management
│   │   ├── tasks.py         # Task CRUD with RBAC enforcement
│   │   └── dashboard.py     # Analytics aggregation
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── railway.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routes + auth guards
│   │   ├── AuthContext.tsx   # JWT auth state (localStorage)
│   │   ├── api.ts            # Axios + JWT interceptor + runtime API URL
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Copper brutalist design system
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx          # Login / Signup
│   │   │   ├── Dashboard.tsx         # Stats, charts, overdue table
│   │   │   ├── ProjectsPage.tsx      # Project list
│   │   │   ├── ProjectDetailPage.tsx # Kanban board + members
│   │   │   ├── MembersPage.tsx       # Member allocation across projects
│   │   │   └── PendingTasksPage.tsx  # Cross-project pending task tracker
│   │   └── components/
│   │       └── Layout.tsx    # Sidebar nav + mobile drawer
│   ├── docker-entrypoint.sh  # Runtime API URL injection
│   ├── nginx.conf            # Nginx + React Router + dynamic $PORT
│   ├── Dockerfile
│   └── railway.toml
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## RBAC Matrix

| Action                   | Admin | Member |
|--------------------------|-------|--------|
| Create / delete project  | ✅    | ❌     |
| Add / remove members     | ✅    | ❌     |
| Create / delete tasks    | ✅    | ❌     |
| View all project tasks   | ✅    | ❌     |
| View own assigned tasks  | ✅    | ✅     |
| Update task (all fields) | ✅    | ❌     |
| Update task status only  | ✅    | ✅     |

---

## Recent Changes

- **5 projects seeded** — Talos, Valor, Atlas, Vindex, Leviathan (HR) with 23 users and 24 tasks
- **Member Allocation page** — per-project member tables with role badges and task load bars
- **Pending Tasks page** — cross-project task tracker with status/priority/project filters
- **Dashboard upgrade** — 6 stat cards, project overview grid, overdue task table with assignee details
- **PORT fix** — hardcoded `PORT=8000` in Railway to match Dockerfile `EXPOSE 8000`
- **DATABASE_URL fix** — switched from MongoDB (misconfigured) to Railway PostgreSQL
- **Runtime API URL injection** — `docker-entrypoint.sh` writes `window.__REACT_APP_API_URL` at container start

---

## Author

**Shubham Singh**
- GitHub: [github.com/bihari-bhau](https://github.com/bihari-bhau)
- LinkedIn: [linkedin.com/in/biharibhau](https://linkedin.com/in/biharibhau)
