import os
import sys
from datetime import datetime, timedelta, timezone

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from database import engine, Base, SessionLocal
from models import User, Project, ProjectMember, Task, RoleEnum, PriorityEnum, StatusEnum
from auth_utils import hash_password


def seed():
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    try:
        # ── Wipe existing data (FK-safe order) ───────────────────────────────
        print("Clearing existing data...")
        db.query(Task).delete()
        db.query(ProjectMember).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

        # ── Users ─────────────────────────────────────────────────────────────
        print("Creating users...")

        admin    = User(name="Shubham Singh",        email="admin@taskflow.io",      hashed_password=hash_password("admin123"))

        # HR
        shreya_hr= User(name="Shreya Sharma",        email="shreya.hr@taskflow.io",  hashed_password=hash_password("shreya123"))

        # Team Alpha → Talos
        ankit    = User(name="Ankit Sharma",         email="ankit@taskflow.io",      hashed_password=hash_password("ankit123"))
        satyendra= User(name="Satyendra Kumar",      email="satyendra@taskflow.io",  hashed_password=hash_password("satyendra123"))
        saumya   = User(name="Saumya Singh",         email="saumya@taskflow.io",     hashed_password=hash_password("saumya123"))
        manu     = User(name="Manu Verma",           email="manu@taskflow.io",       hashed_password=hash_password("manu123"))
        shivansh = User(name="Shivansh Rai",         email="shivansh@taskflow.io",   hashed_password=hash_password("shivansh123"))

        # Team Beta → Valor
        sumit    = User(name="Sumit Gupta",          email="sumit@taskflow.io",      hashed_password=hash_password("sumit123"))
        priya    = User(name="Priya Patel",          email="priya@taskflow.io",      hashed_password=hash_password("priya123"))
        sneha    = User(name="Sneha Mishra",         email="sneha@taskflow.io",      hashed_password=hash_password("sneha123"))
        rahul    = User(name="Rahul Tiwari",         email="rahul@taskflow.io",      hashed_password=hash_password("rahul123"))
        shreyansh= User(name="Shreyansh Parashar",   email="shreyansh@taskflow.io",  hashed_password=hash_password("shreyansh123"))

        # Team Gamma → Atlas
        dhananjay= User(name="Dhananjay Rao",        email="dhananjay@taskflow.io",  hashed_password=hash_password("dhananjay123"))
        vaibhav  = User(name="Vaibhav Joshi",        email="vaibhav@taskflow.io",    hashed_password=hash_password("vaibhav123"))
        shreya   = User(name="Shreya Das",           email="shreya@taskflow.io",     hashed_password=hash_password("shreya123"))
        gaurav   = User(name="Gaurav Pandey",        email="gaurav@taskflow.io",     hashed_password=hash_password("gaurav123"))

        # Team Delta → Vindex
        yash     = User(name="Yash Agarwal",         email="yash@taskflow.io",       hashed_password=hash_password("yash123"))
        madhwan  = User(name="Madhwan Dubey",        email="madhwan@taskflow.io",    hashed_password=hash_password("madhwan123"))
        mayank   = User(name="Mayank Chauhan",       email="mayank@taskflow.io",     hashed_password=hash_password("mayank123"))
        shahnawaz= User(name="Md Shahnawaz Akhtar",  email="shahnawaz@taskflow.io",  hashed_password=hash_password("shahnawaz123"))

        # Team Epsilon → Leviathan
        kanak    = User(name="Kanak Yadav",          email="kanak@taskflow.io",      hashed_password=hash_password("kanak123"))
        shivani  = User(name="Shivani",              email="shivani@taskflow.io",    hashed_password=hash_password("shivani123"))
        navreet  = User(name="Navreet Kaur",         email="navreet@taskflow.io",    hashed_password=hash_password("navreet123"))

        all_users = [
            admin, shreya_hr,
            ankit, satyendra, saumya, manu, shivansh,
            sumit, priya, sneha, rahul, shreyansh,
            dhananjay, vaibhav, shreya, gaurav,
            yash, madhwan, mayank, shahnawaz,
            kanak, shivani, navreet,
        ]
        for u in all_users:
            db.add(u)
        db.commit()
        for u in all_users:
            db.refresh(u)

        # ── Projects ──────────────────────────────────────────────────────────
        print("Creating projects...")

        talos    = Project(name="Talos",     description="AI-powered analytics platform for real-time data processing and insights generation.", created_by=admin.id)
        valor    = Project(name="Valor",     description="Next-gen mobile banking application with biometric authentication and smart budgeting.", created_by=admin.id)
        atlas    = Project(name="Atlas",     description="Cloud infrastructure management dashboard for multi-cloud deployments.", created_by=admin.id)
        vindex   = Project(name="Vindex",    description="Enterprise search engine with NLP-powered semantic search and document indexing.", created_by=admin.id)
        leviathan= Project(name="Leviathan", description="HR operations platform for onboarding, payroll automation, and employee lifecycle management.", created_by=shreya_hr.id)

        for p in [talos, valor, atlas, vindex, leviathan]:
            db.add(p)
        db.commit()
        for p in [talos, valor, atlas, vindex, leviathan]:
            db.refresh(p)

        # ── Project Members ───────────────────────────────────────────────────
        print("Allocating members to projects...")

        memberships = [
            # Talos — Team Alpha (admin + 5 members)
            ProjectMember(project_id=talos.id,  user_id=admin.id,     role=RoleEnum.admin),
            ProjectMember(project_id=talos.id,  user_id=ankit.id,     role=RoleEnum.member),
            ProjectMember(project_id=talos.id,  user_id=satyendra.id, role=RoleEnum.member),
            ProjectMember(project_id=talos.id,  user_id=saumya.id,    role=RoleEnum.member),
            ProjectMember(project_id=talos.id,  user_id=manu.id,      role=RoleEnum.member),
            ProjectMember(project_id=talos.id,  user_id=shivansh.id,  role=RoleEnum.member),

            # Valor — Team Beta (admin + 5 members)
            ProjectMember(project_id=valor.id,  user_id=admin.id,      role=RoleEnum.admin),
            ProjectMember(project_id=valor.id,  user_id=sumit.id,      role=RoleEnum.member),
            ProjectMember(project_id=valor.id,  user_id=priya.id,      role=RoleEnum.member),
            ProjectMember(project_id=valor.id,  user_id=sneha.id,      role=RoleEnum.member),
            ProjectMember(project_id=valor.id,  user_id=rahul.id,      role=RoleEnum.member),
            ProjectMember(project_id=valor.id,  user_id=shreyansh.id,  role=RoleEnum.member),

            # Atlas — Team Gamma (admin + 4 members)
            ProjectMember(project_id=atlas.id,  user_id=admin.id,      role=RoleEnum.admin),
            ProjectMember(project_id=atlas.id,  user_id=dhananjay.id,  role=RoleEnum.member),
            ProjectMember(project_id=atlas.id,  user_id=vaibhav.id,    role=RoleEnum.member),
            ProjectMember(project_id=atlas.id,  user_id=shreya.id,     role=RoleEnum.member),
            ProjectMember(project_id=atlas.id,  user_id=gaurav.id,     role=RoleEnum.member),

            # Vindex — Team Delta (admin + 4 members)
            ProjectMember(project_id=vindex.id, user_id=admin.id,      role=RoleEnum.admin),
            ProjectMember(project_id=vindex.id, user_id=yash.id,       role=RoleEnum.member),
            ProjectMember(project_id=vindex.id, user_id=madhwan.id,    role=RoleEnum.member),
            ProjectMember(project_id=vindex.id, user_id=mayank.id,     role=RoleEnum.member),
            ProjectMember(project_id=vindex.id, user_id=shahnawaz.id,  role=RoleEnum.member),

            # Leviathan — Team Epsilon (Shreya HR as admin + 3 members)
            ProjectMember(project_id=leviathan.id, user_id=admin.id,     role=RoleEnum.admin),
            ProjectMember(project_id=leviathan.id, user_id=shreya_hr.id, role=RoleEnum.admin),
            ProjectMember(project_id=leviathan.id, user_id=kanak.id,     role=RoleEnum.member),
            ProjectMember(project_id=leviathan.id, user_id=shivani.id,   role=RoleEnum.member),
            ProjectMember(project_id=leviathan.id, user_id=navreet.id,   role=RoleEnum.member),
        ]
        for m in memberships:
            db.add(m)
        db.commit()

        # ── Tasks ─────────────────────────────────────────────────────────────
        print("Creating tasks...")

        tasks = [
            # ── Talos (Team Alpha) ───────────────────────────────────────────
            Task(title="Design data pipeline architecture",
                 description="Create ETL pipeline diagrams and data flow documentation",
                 priority=PriorityEnum.high,   status=StatusEnum.done,
                 due_date=now - timedelta(days=3),
                 project_id=talos.id, assigned_to=ankit.id,     created_by=admin.id),

            Task(title="Implement Kafka consumers",
                 description="Set up message queue consumers for streaming data ingestion",
                 priority=PriorityEnum.high,   status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=5),
                 project_id=talos.id, assigned_to=satyendra.id, created_by=admin.id),

            Task(title="Build analytics dashboard UI",
                 description="React components for real-time chart visualizations",
                 priority=PriorityEnum.medium, status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=7),
                 project_id=talos.id, assigned_to=saumya.id,    created_by=admin.id),

            Task(title="Write unit tests for API layer",
                 description="Pytest coverage for all data pipeline endpoints",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=10),
                 project_id=talos.id, assigned_to=manu.id,      created_by=admin.id),

            Task(title="Optimize database queries",
                 description="Add indexes and rewrite slow analytical queries",
                 priority=PriorityEnum.low,    status=StatusEnum.todo,
                 due_date=now + timedelta(days=14),
                 project_id=talos.id, assigned_to=ankit.id,     created_by=admin.id),

            Task(title="Integrate third-party data sources",
                 description="Connect external APIs for market and weather data feeds",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=18),
                 project_id=talos.id, assigned_to=shivansh.id,  created_by=admin.id),

            # ── Valor (Team Beta) ────────────────────────────────────────────
            Task(title="Implement biometric auth module",
                 description="Fingerprint and face ID integration for mobile login",
                 priority=PriorityEnum.high,   status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=4),
                 project_id=valor.id, assigned_to=sumit.id,     created_by=admin.id),

            Task(title="Design transaction history page",
                 description="Figma mockups and React implementation for transaction list",
                 priority=PriorityEnum.medium, status=StatusEnum.done,
                 due_date=now - timedelta(days=5),
                 project_id=valor.id, assigned_to=priya.id,     created_by=admin.id),

            Task(title="Build budget tracking feature",
                 description="Monthly spending analytics with category breakdown charts",
                 priority=PriorityEnum.high,   status=StatusEnum.todo,
                 due_date=now + timedelta(days=8),
                 project_id=valor.id, assigned_to=sneha.id,     created_by=admin.id),

            Task(title="API security audit",
                 description="Review and remediate OWASP Top 10 vulnerabilities",
                 priority=PriorityEnum.high,   status=StatusEnum.todo,
                 due_date=now - timedelta(days=1),   # overdue
                 project_id=valor.id, assigned_to=rahul.id,     created_by=admin.id),

            Task(title="Write onboarding flow screens",
                 description="Design and implement 5-step user onboarding with animations",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=12),
                 project_id=valor.id, assigned_to=shreyansh.id, created_by=admin.id),

            # ── Atlas (Team Gamma) ───────────────────────────────────────────
            Task(title="Setup Terraform modules",
                 description="IaC templates covering AWS, GCP, and Azure deployments",
                 priority=PriorityEnum.high,   status=StatusEnum.done,
                 due_date=now - timedelta(days=7),
                 project_id=atlas.id, assigned_to=dhananjay.id, created_by=admin.id),

            Task(title="Build deployment wizard UI",
                 description="Step-by-step cloud deployment interface with validation",
                 priority=PriorityEnum.medium, status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=6),
                 project_id=atlas.id, assigned_to=vaibhav.id,   created_by=admin.id),

            Task(title="Implement monitoring alerts",
                 description="Configure threshold alerts for CPU, memory, and disk usage",
                 priority=PriorityEnum.high,   status=StatusEnum.todo,
                 due_date=now + timedelta(days=3),
                 project_id=atlas.id, assigned_to=shreya.id,    created_by=admin.id),

            Task(title="Write API and user documentation",
                 description="Comprehensive user guides, API reference, and runbooks",
                 priority=PriorityEnum.low,    status=StatusEnum.todo,
                 due_date=now + timedelta(days=15),
                 project_id=atlas.id, assigned_to=gaurav.id,    created_by=admin.id),

            # ── Vindex (Team Delta) ──────────────────────────────────────────
            Task(title="Research NLP models",
                 description="Benchmark BERT, RoBERTa, and GPT variants for semantic search quality",
                 priority=PriorityEnum.high,   status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=12),
                 project_id=vindex.id, assigned_to=yash.id,     created_by=admin.id),

            Task(title="Design search result ranking algorithm",
                 description="Build relevance scoring with BM25 + vector similarity hybrid",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=20),
                 project_id=vindex.id, assigned_to=madhwan.id,  created_by=admin.id),

            Task(title="Build document indexing service",
                 description="Elasticsearch integration with incremental re-indexing support",
                 priority=PriorityEnum.high,   status=StatusEnum.todo,
                 due_date=now + timedelta(days=25),
                 project_id=vindex.id, assigned_to=mayank.id,   created_by=admin.id),

            Task(title="Implement query auto-complete",
                 description="Real-time search suggestions using trie and ML ranking",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=30),
                 project_id=vindex.id, assigned_to=shahnawaz.id, created_by=admin.id),

            # ── Leviathan (Team Epsilon) ─────────────────────────────────────
            Task(title="Build employee onboarding portal",
                 description="Self-service portal for new hire document submission and orientation scheduling",
                 priority=PriorityEnum.high,   status=StatusEnum.in_progress,
                 due_date=now + timedelta(days=6),
                 project_id=leviathan.id, assigned_to=kanak.id,   created_by=shreya_hr.id),

            Task(title="Design payroll automation workflow",
                 description="Automate monthly payroll processing with tax deduction rules",
                 priority=PriorityEnum.high,   status=StatusEnum.todo,
                 due_date=now + timedelta(days=10),
                 project_id=leviathan.id, assigned_to=shivani.id, created_by=shreya_hr.id),

            Task(title="Implement leave management system",
                 description="Track leave balances, approvals, and holiday calendars across teams",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now + timedelta(days=15),
                 project_id=leviathan.id, assigned_to=navreet.id, created_by=shreya_hr.id),

            Task(title="Create performance review templates",
                 description="Quarterly and annual appraisal forms with 360-degree feedback",
                 priority=PriorityEnum.medium, status=StatusEnum.todo,
                 due_date=now - timedelta(days=2),   # overdue
                 project_id=leviathan.id, assigned_to=kanak.id,   created_by=shreya_hr.id),

            Task(title="HR policy documentation update",
                 description="Revise and publish updated HR handbook for FY 2026-27",
                 priority=PriorityEnum.low,    status=StatusEnum.todo,
                 due_date=now + timedelta(days=20),
                 project_id=leviathan.id, assigned_to=shivani.id, created_by=shreya_hr.id),
        ]

        for t in tasks:
            db.add(t)
        db.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        print()
        print("=" * 60)
        print("  TASKFLOW SEED COMPLETE")
        print("=" * 60)
        print(f"\n  {'Email':<35} {'Password':<15} {'Team'}")
        print(f"  {'-'*60}")
        print(f"  {'admin@taskflow.io':<35} {'admin123':<15} ADMIN (all projects)")
        print(f"  {'shreya.hr@taskflow.io':<35} {'shreya123':<15} HR — Leviathan (admin)")
        print(f"  {'-'*60}")
        rows = [
            ("ankit@taskflow.io",      "ankit123",      "Talos"),
            ("satyendra@taskflow.io",  "satyendra123",  "Talos"),
            ("saumya@taskflow.io",     "saumya123",     "Talos"),
            ("manu@taskflow.io",       "manu123",       "Talos"),
            ("shivansh@taskflow.io",   "shivansh123",   "Talos"),
            ("sumit@taskflow.io",      "sumit123",      "Valor"),
            ("priya@taskflow.io",      "priya123",      "Valor"),
            ("sneha@taskflow.io",      "sneha123",      "Valor"),
            ("rahul@taskflow.io",      "rahul123",      "Valor"),
            ("shreyansh@taskflow.io",  "shreyansh123",  "Valor"),
            ("dhananjay@taskflow.io",  "dhananjay123",  "Atlas"),
            ("vaibhav@taskflow.io",    "vaibhav123",    "Atlas"),
            ("shreya@taskflow.io",     "shreya123",     "Atlas"),
            ("gaurav@taskflow.io",     "gaurav123",     "Atlas"),
            ("yash@taskflow.io",       "yash123",       "Vindex"),
            ("madhwan@taskflow.io",    "madhwan123",    "Vindex"),
            ("mayank@taskflow.io",     "mayank123",     "Vindex"),
            ("shahnawaz@taskflow.io",  "shahnawaz123",  "Vindex"),
            ("kanak@taskflow.io",      "kanak123",      "Leviathan"),
            ("shivani@taskflow.io",    "shivani123",    "Leviathan"),
            ("navreet@taskflow.io",    "navreet123",    "Leviathan"),
        ]
        for email, pwd, team in rows:
            print(f"  {email:<35} {pwd:<15} {team}")
        print()
        print(f"  Projects : 5  (Talos, Valor, Atlas, Vindex, Leviathan)")
        print(f"  Members  : 23 (1 admin + 1 HR + 21 members)")
        print(f"  Tasks    : {len(tasks)}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()