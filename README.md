# TaskFlow — Team Task Manager

A full-stack team task management application with JWT authentication, role-based access control (Admin/Member), Kanban board, and analytics dashboard.

**Deployed with: Supabase (PostgreSQL) + Render (hosting)**

## Live Demo
- **Frontend:** `https://taskflow-frontend.onrender.com`
- **Backend API:** `https://taskflow-backend.onrender.com`
- **Swagger Docs:** `https://taskflow-backend.onrender.com/docs`

---

## Tech Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | React 18, TypeScript, React Router v6, Recharts    |
| Backend    | FastAPI (Python 3.11), SQLAlchemy ORM              |
| Database   | Supabase (PostgreSQL) — SQLite for local dev       |
| Auth       | JWT (python-jose) + bcrypt (passlib)               |
| Hosting    | Render (backend + frontend static site)            |

---

## Features

- **Auth:** Signup / Login with JWT tokens (7-day expiry), bcrypt password hashing
- **Projects:** Create projects (creator = Admin), invite members by email, delete projects
- **Tasks:** Title, Description, Due Date, Priority, Assignee, Status (Kanban board)
- **RBAC:** Admins manage everything; Members update only their assigned task status
- **Dashboard:** Stats cards, completion rate (pie chart), tasks per user (bar chart), overdue alerts

---

## Local Development (Zero Setup)

The backend uses **SQLite by default** — no database needed locally.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
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

### Or with Docker
```bash
docker-compose up --build
```

---

## Deployment — Supabase + Render

### Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Enter project name, set a strong database password, choose a region
3. Wait ~2 minutes for provisioning
4. Go to **Settings → Database → Connection string → URI**
5. Copy the URI — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghij.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual password

> **Note:** Tables are created automatically when the backend starts — no SQL migrations needed.

---

### Step 2: Deploy Backend on Render

1. Push your code to a **public GitHub repository**
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   ```
   DATABASE_URL = postgresql://postgres:YOUR-PASSWORD@db.XXXX.supabase.co:5432/postgres
   SECRET_KEY   = (click "Generate" — Render creates a secure random value)
   ```
6. Click **Create Web Service**
7. Copy your backend URL: `https://taskflow-backend.onrender.com`

---

### Step 3: Deploy Frontend on Render

1. Render dashboard → **New → Static Site**
2. Connect the same GitHub repo
3. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory:** `build`
4. Under **Environment Variables**, add:
   ```
   REACT_APP_API_URL = https://taskflow-backend.onrender.com/api
   ```
   *(Use your actual backend URL from Step 2)*
5. Under **Redirects/Rewrites**, add a rule:
   - Source: `/*`  →  Destination: `/index.html`  →  Type: `Rewrite`
   *(This enables React Router client-side navigation)*
6. Click **Create Static Site**

---

### Step 4: Verify

```
✅ Open frontend URL → Login page loads
✅ Sign up with name + email + password
✅ Create a project → you become Admin automatically
✅ Add a member by email (they must have signed up first)
✅ Create tasks with priority + due date + assignee
✅ Kanban board shows To Do / In Progress / Done columns
✅ Dashboard shows charts and stats
✅ Log in as Member → only assigned tasks visible
```

---

## Environment Variables Reference

### Backend
| Variable       | Description                                    | Local Default             |
|----------------|------------------------------------------------|---------------------------|
| `DATABASE_URL` | Supabase PostgreSQL connection URI             | `sqlite:///./taskflow.db` |
| `SECRET_KEY`   | JWT signing secret (32+ chars, keep private)  | Dev fallback (change!)    |

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
│   ├── routers/
│   │   ├── auth.py          # Signup, Login, Me
│   │   ├── projects.py      # Project CRUD + member management
│   │   ├── tasks.py         # Task CRUD with RBAC enforcement
│   │   └── dashboard.py     # Analytics aggregation
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml          # Render deployment config
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Routes + auth guards
│   │   ├── AuthContext.tsx   # JWT auth state (localStorage)
│   │   ├── api.ts            # Axios + JWT interceptor
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── index.css         # Dark design system
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   └── ProjectDetailPage.tsx
│   │   └── components/
│   │       └── Layout.tsx
│   ├── .env                  # Local dev API URL
│   ├── .env.production       # Production API URL
│   ├── Dockerfile
│   └── render.yaml
│
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

## Author

**Shubham Singh**
- GitHub: [github.com/bihari-bhau](https://github.com/bihari-bhau)
- LinkedIn: [linkedin.com/in/biharibhau](https://linkedin.com/in/biharibhau)
