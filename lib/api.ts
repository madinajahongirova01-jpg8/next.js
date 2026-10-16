export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) {
    logout();
  }

  return response;
}
export type Role = "owner" | "admin" | "member" | "guest";

export interface Member {
  workspace_id: string;
  user_id: string;
  role: Role;
  created_at: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  guest: "Гость",
};

export function errorMessage(
  status: number,
  messages: Record<number, string>,
): string {
  return messages[status] ?? "Ошибка сервера. Попробуйте позже";
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  identifier: string;
  description: string | null;
  lead_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface State {
  id: string;
  project_id: string;
  name: string;
  color: string;
  group: "backlog" | "unstarted" | "started" | "completed" | "cancelled";
  order: number;
  is_default: boolean;
}

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface Issue {
  id: string;
  project_id: string;
  sequence_id: number;
  title: string;
  description: string | null;
  state_id: string;
  priority: Priority;
  due_date: string | null;
  created_at: string;
    assignees: Assignee[];
      labels: IssueLabel[];
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: "Без приоритета",
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Assignee {
  issue_id: string;
  user_id: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

export interface IssueLabel {
  issue_id: string;
  label_id: string;
  label: Label;
}

export interface Activity {
  id: string;
  issue_id: string | null;
  actor_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}