// ─────────────────────────────────────────────────────────────────────────────
// ADD these to your existing types.ts if not already present
// ─────────────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface MemberOut {
  id: number;
  user_id: number;
  role: 'admin' | 'member';
  user: UserOut;
  joined_at: string;
}

export interface ProjectOut {
  id: number;
  name: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
  members: MemberOut[];
}

export interface TaskOut {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  project_id: number;
  assigned_to: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  assignee: UserOut | null;
  creator: UserOut | null;
}

export interface TasksByStatus {
  todo: number;
  in_progress: number;
  done: number;
}

export interface UserTaskCount {
  user_id: number;
  name: string;
  email: string;
  count: number;
}

export interface DashboardData {
  total_projects: number;
  total_tasks: number;
  my_tasks: number;
  overdue_tasks: number;
  tasks_by_status: TasksByStatus;
  tasks_per_user: UserTaskCount[];
  completion_rate: number;
}
