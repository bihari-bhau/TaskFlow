export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Member {
  id: number;
  user_id: number;
  role: 'admin' | 'member';
  user: User;
  joined_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_by?: number;
  created_at: string;
  members: Member[];
}

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  priority: Priority;
  status: TaskStatus;
  project_id: number;
  assigned_to?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
  assignee?: User;
  creator?: User;
}

export interface DashboardData {
  total_projects: number;
  total_tasks: number;
  my_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  tasks_by_status: {
    todo: number;
    in_progress: number;
    done: number;
  };
  tasks_per_user: {
    user_id: number;
    name: string;
    email: string;
    count: number;
  }[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
