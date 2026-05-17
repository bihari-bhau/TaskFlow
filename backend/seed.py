"""
TaskFlow - Database Seed Script
================================
Run this once after deployment to populate the database with demo data.

Usage:
    cd backend
    python seed.py

Demo accounts created:
    Admin : admin@taskflow.io  / admin123
    Member: member@taskflow.io  / member123
    Member: dev@taskflow.io     / dev123
"""

import os
import sys
from datetime import datetime, timezone, timedelta

# Load .env file if present (for local dev)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not installed, rely on actual env vars

from database import engine, Base, SessionLocal
from models import User, Project, ProjectMember, Task, RoleEnum, PriorityEnum, StatusEnum
from auth_utils import hash_password


def seed():
    print("\n[+] TaskFlow Seed Script")
    print("=" * 40)

    # Create all tables (safe to run even if already exist)
    print("[*] Creating tables if not exist...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # ── Check if already seeded ──────────────────────────────────────────
        existing = db.query(User).filter_by(email="admin@taskflow.io").first()
        if existing:
            print("\n[!] Database already seeded!")
            print("   admin@taskflow.io already exists.")
            print("   To re-seed, delete the existing data first.\n")
            return

        print("[-] Creating demo users...")

        # ── Users ─────────────────────────────────────────────────────────────
        admin = User(
            name="Shubham Singh",
            email="admin@taskflow.io",
            hashed_password=hash_password("admin123")
        )
        member1 = User(
            name="Shreya Sharma",
            email="member@taskflow.io",
            hashed_password=hash_password("member123")
        )
        member2 = User(
            name="Dev User",
            email="dev@taskflow.io",
            hashed_password=hash_password("dev123")
        )

        db.add_all([admin, member1, member2])
        db.flush()  # Get IDs without committing

        print(f"   [OK] {admin.name} ({admin.email}) — Admin")
        print(f"   [OK] {member1.name} ({member1.email}) — Member")
        print(f"   [OK] {member2.name} ({member2.email}) — Member")

        # ── Projects ──────────────────────────────────────────────────────────
        print("\n[-] Creating demo projects...")

        now = datetime.now(timezone.utc)

        project1 = Project(
            name="Kaiju Benchmark Pipeline",
            description="AI agent benchmarking on Python library reconstruction. Based on Commit0 paper (ICLR 2025).",
            created_by=admin.id
        )
        project2 = Project(
            name="rlhf-eval Platform",
            description="Full-stack RLHF evaluation platform with React + FastAPI + PostgreSQL.",
            created_by=admin.id
        )

        db.add_all([project1, project2])
        db.flush()

        print(f"   [OK] {project1.name}")
        print(f"   [OK] {project2.name}")

        # ── Members ───────────────────────────────────────────────────────────
        print("\n[-] Adding project members...")

        memberships = [
            # Project 1
            ProjectMember(project_id=project1.id, user_id=admin.id,   role=RoleEnum.admin),
            ProjectMember(project_id=project1.id, user_id=member1.id, role=RoleEnum.member),
            ProjectMember(project_id=project1.id, user_id=member2.id, role=RoleEnum.member),
            # Project 2
            ProjectMember(project_id=project2.id, user_id=admin.id,   role=RoleEnum.admin),
            ProjectMember(project_id=project2.id, user_id=member1.id, role=RoleEnum.member),
        ]
        db.add_all(memberships)
        db.flush()
        print("   [OK] All memberships created")

        # ── Tasks ─────────────────────────────────────────────────────────────
        print("\n[-] Creating demo tasks...")

        tasks = [
            # ── Project 1 tasks ──────────────────────────────────────────────
            Task(
                title="Set up repo_checker.py pipeline",
                description="Validate repos against 38 criteria using GitHub API and local AST analysis.",
                priority=PriorityEnum.high,
                status=StatusEnum.done,
                project_id=project1.id,
                assigned_to=admin.id,
                created_by=admin.id,
                due_date=now - timedelta(days=5),
            ),
            Task(
                title="Build AST stub generator",
                description="Strip function bodies using Python AST to create reconstruction stubs for AI agents.",
                priority=PriorityEnum.high,
                status=StatusEnum.in_progress,
                project_id=project1.id,
                assigned_to=admin.id,
                created_by=admin.id,
                due_date=now + timedelta(days=3),
            ),
            Task(
                title="Integrate pytest pass rate evaluator",
                description="Auto-run test suites after agent reconstruction and record pass rates.",
                priority=PriorityEnum.medium,
                status=StatusEnum.todo,
                project_id=project1.id,
                assigned_to=member1.id,
                created_by=admin.id,
                due_date=now + timedelta(days=7),
            ),
            Task(
                title="Curate ethara-lite split (4 libs)",
                description="Select 4 qualifying Python libraries for the lite evaluation split.",
                priority=PriorityEnum.medium,
                status=StatusEnum.in_progress,
                project_id=project1.id,
                assigned_to=member2.id,
                created_by=admin.id,
                due_date=now - timedelta(days=1),  # overdue
            ),
            Task(
                title="Write Commit0 paper summary",
                description="Document key findings — OpenHands achieved 42.95% on lite split.",
                priority=PriorityEnum.low,
                status=StatusEnum.todo,
                project_id=project1.id,
                assigned_to=None,
                created_by=admin.id,
                due_date=now + timedelta(days=10),
            ),
            # ── Project 2 tasks ──────────────────────────────────────────────
            Task(
                title="Design DB schema",
                description="SQLAlchemy models for Repo, Evaluation, StarRating, RepoComparison tables.",
                priority=PriorityEnum.high,
                status=StatusEnum.done,
                project_id=project2.id,
                assigned_to=admin.id,
                created_by=admin.id,
                due_date=now - timedelta(days=8),
            ),
            Task(
                title="Build A/B evaluation UI",
                description="Side-by-side comparison page with 6-dimension scoring (1–6 scale).",
                priority=PriorityEnum.high,
                status=StatusEnum.in_progress,
                project_id=project2.id,
                assigned_to=admin.id,
                created_by=admin.id,
                due_date=now + timedelta(days=4),
            ),
            Task(
                title="JSONL export for pairwise comparisons",
                description="Export RepoComparison and StarRating records as JSONL for training.",
                priority=PriorityEnum.medium,
                status=StatusEnum.done,
                project_id=project2.id,
                assigned_to=member1.id,
                created_by=admin.id,
                due_date=now - timedelta(days=2),
            ),
            Task(
                title="Deploy to HuggingFace Spaces",
                description="Package and deploy rlhf-eval backend + frontend to HuggingFace.",
                priority=PriorityEnum.medium,
                status=StatusEnum.todo,
                project_id=project2.id,
                assigned_to=member1.id,
                created_by=admin.id,
                due_date=now + timedelta(days=14),
            ),
            Task(
                title="Analytics dashboard",
                description="Charts for rating distribution, inter-annotator agreement, model rankings.",
                priority=PriorityEnum.low,
                status=StatusEnum.todo,
                project_id=project2.id,
                assigned_to=None,
                created_by=admin.id,
                due_date=now + timedelta(days=20),
            ),
        ]

        db.add_all(tasks)
        db.commit()

        print(f"   [OK] {len(tasks)} tasks created across {2} projects")

        # ── Summary ───────────────────────────────────────────────────────────
        print("\n" + "=" * 40)
        print("[OK] Seed complete! Demo accounts ready:\n")
        print("  ┌─────────────────────────────────────────┐")
        print("  │  Role   │ Email                │ Password │")
        print("  ├─────────────────────────────────────────┤")
        print("  │  Admin  │ admin@taskflow.io   │ admin123 │")
        print("  │  Member │ member@taskflow.io  │ member123│")
        print("  │  Member │ dev@taskflow.io     │ dev123   │")
        print("  └─────────────────────────────────────────┘")
        print()
        print("  Projects seeded:")
        print("  • Kaiju Benchmark Pipeline (5 tasks)")
        print("  • rlhf-eval Platform (5 tasks)")
        print()
        print("  Open your app and log in with any account above!")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n[X] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
