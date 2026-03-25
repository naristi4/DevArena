// ─── Server-side DB → domain-type mappers ────────────────────────────────────
// These run only in API routes and server components (Node.js only).

import type { Task } from "@/lib/tasks";
import type { Subtask } from "@/lib/subtasks";

// ─── Task mapper ──────────────────────────────────────────────────────────────

export function dbTaskToTask(t: {
  id:             string;
  title:          string;
  description:    string | null;
  projectId:      string;
  status:         string;
  type:           string;
  priority:       string;
  estimatedTime:  number | null;
  actualTime:     number | null;
  targetEndDate:  Date | null;
  startDate:      Date | null;
  completionDate: Date | null;
  assignee:       { name: string } | null;
}): Task {
  const d = (dt: Date | null) => dt ? dt.toISOString().split("T")[0] : undefined;
  return {
    id:              t.id,
    title:           t.title,
    description:     t.description ?? "",
    project_id:      t.projectId,
    assigned_to:     t.assignee?.name ?? "",
    estimated_time:  t.estimatedTime ?? 0,
    actual_time:     t.actualTime    ?? 0,
    status:          t.status   as Task["status"],
    type:            t.type     as Task["type"],
    priority:        t.priority as Task["priority"],
    target_end_date: d(t.targetEndDate),
    start_date:      d(t.startDate),
    completion_date: d(t.completionDate),
  };
}

// ─── Subtask mapper ───────────────────────────────────────────────────────────

export function dbSubtaskToSubtask(st: {
  id:          string;
  taskId:      string;
  title:       string;
  description: string | null;
  status:      string;
  assignee:    { name: string } | null;
}): Subtask {
  return {
    id:            st.id,
    task_id:       st.taskId,
    title:         st.title,
    description:   st.description ?? "",
    status:        st.status as Subtask["status"],
    assigned_user: st.assignee?.name ?? "",
  };
}
