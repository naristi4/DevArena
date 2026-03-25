export type TaskStatus =
  | "backlog"
  | "in_progress"
  | "review"
  | "ready_to_release"
  | "done";

/** Subset of TaskStatus values that represent in-flight work */
export type ActiveStatus = "in_progress" | "review" | "ready_to_release";

export const ACTIVE_STATUSES: readonly ActiveStatus[] = [
  "in_progress",
  "review",
  "ready_to_release",
] as const;

export type TaskType     = "task" | "bug" | "iteration";
export type TaskPriority = "urgent"  | "high" | "medium" | "low";

export interface Task {
  id:               string;
  title:            string;
  description:      string;
  project_id:       string;
  assigned_to:      string;        // user name
  estimated_time:   number;        // hours — kept for backward compat
  actual_time:      number;        // hours — kept for backward compat
  status:           TaskStatus;
  type?:            TaskType;
  priority?:        TaskPriority;
  target_end_date?: string;        // YYYY-MM-DD; set by user at creation/edit
  start_date?:      string;        // YYYY-MM-DD; auto-set when → in_progress
  completion_date?: string;        // YYYY-MM-DD; auto-set when → done
}

// ─── Utility: auto-fill date fields on status transitions ────────────────────

export function applyStatusDates(task: Task, newStatus: TaskStatus): Partial<Task> {
  const today   = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const updates: Partial<Task> = {};

  // Record when development actually begins (only set once)
  if (newStatus === "in_progress" && task.status !== "in_progress" && !task.start_date) {
    updates.start_date = today;
  }

  // Record when the task is completed (only set once — preserve any date already confirmed by the user)
  if (newStatus === "done" && task.status !== "done" && !task.completion_date) {
    updates.completion_date = today;
  }

  return updates;
}

// ─── Date confirmation prompt helper ─────────────────────────────────────────
// Returns modal config if a date must be confirmed before the transition,
// or null if the transition can proceed immediately.

export interface DatePrompt {
  field:      "start_date" | "completion_date";
  title:      string;
  message:    string;
  fieldLabel: string;
}

export function getDatePrompt(task: Task, newStatus: TaskStatus): DatePrompt | null {
  if (newStatus === "in_progress" && task.status !== "in_progress" && !task.start_date) {
    return {
      field:      "start_date",
      title:      "Set Task Start Date",
      message:    "This task is starting. Please confirm the start date.",
      fieldLabel: "Start Date",
    };
  }
  if (newStatus === "done" && task.status !== "done" && !task.completion_date) {
    return {
      field:      "completion_date",
      title:      "Set Completion Date",
      message:    "This task is being completed. Please confirm the completion date.",
      fieldLabel: "Completion Date",
    };
  }
  return null;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Dates are expressed relative to 2026-03-15 (current date in session).
// done tasks: target_end_date + completion_date (some on-time, some late)
// in-flight tasks: start_date + target_end_date
// backlog tasks: target_end_date only

export const MOCK_TASKS: Task[] = [
  // ── Project 1: Migración a Kubernetes ─────────────────────────────────────
  {
    id:               "t1",
    title:            "Diseñar arquitectura de namespaces",
    description:      "Definir la estructura de namespaces para separar ambientes de producción, staging y desarrollo.",
    project_id:       "1",
    assigned_to:      "Alice Johnson",
    estimated_time:   4,
    actual_time:      5,
    status:           "done",
    type:             "task",
    priority:         "high",
    target_end_date:  "2026-02-20",
    start_date:       "2026-02-10",
    completion_date:  "2026-02-19", // on time
  },
  {
    id:               "t2",
    title:            "Configurar cluster de Kubernetes en staging",
    description:      "Provisionar el cluster en el proveedor cloud y aplicar la configuración base.",
    project_id:       "1",
    assigned_to:      "Bob Smith",
    estimated_time:   8,
    actual_time:      9,
    status:           "done",
    type:             "task",
    priority:         "urgent",
    target_end_date:  "2026-02-25",
    start_date:       "2026-02-12",
    completion_date:  "2026-02-27", // late
  },
  {
    id:               "t3",
    title:            "Migrar servicio de autenticación",
    description:      "Containerizar y desplegar el servicio de auth en el nuevo cluster.",
    project_id:       "1",
    assigned_to:      "Alice Johnson",
    estimated_time:   6,
    actual_time:      4,
    status:           "in_progress",
    type:             "task",
    priority:         "high",
    target_end_date:  "2026-03-22",
    start_date:       "2026-03-10",
  },
  {
    id:               "t4",
    title:            "Migrar servicio de pagos",
    description:      "Containerizar y desplegar el servicio de pagos con sus dependencias.",
    project_id:       "1",
    assigned_to:      "Bob Smith",
    estimated_time:   8,
    actual_time:      0,
    status:           "backlog",
    type:             "task",
    priority:         "medium",
    target_end_date:  "2026-04-05",
  },
  {
    id:               "t5",
    title:            "Configurar auto-scaling",
    description:      "Definir políticas de escalado horizontal para los servicios críticos.",
    project_id:       "1",
    assigned_to:      "Alice Johnson",
    estimated_time:   3,
    actual_time:      0,
    status:           "backlog",
    type:             "task",
    priority:         "medium",
    target_end_date:  "2026-04-12",
  },
  {
    id:               "t6",
    title:            "Validar monitoreo y alertas",
    description:      "Verificar que Prometheus y Grafana estén recibiendo métricas correctamente.",
    project_id:       "1",
    assigned_to:      "Bob Smith",
    estimated_time:   4,
    actual_time:      3,
    status:           "review",
    type:             "task",
    priority:         "low",
    target_end_date:  "2026-03-20",
    start_date:       "2026-03-08",
  },

  // ── Project 2: Nuevo onboarding de usuarios ────────────────────────────────
  {
    id:               "t7",
    title:            "Definir flujo de onboarding en Figma",
    description:      "Crear wireframes y prototipos del nuevo flujo de bienvenida para revisión del equipo.",
    project_id:       "2",
    assigned_to:      "Carol White",
    estimated_time:   6,
    actual_time:      7,
    status:           "done",
    type:             "task",
    priority:         "medium",
    target_end_date:  "2026-02-28",
    start_date:       "2026-02-18",
    completion_date:  "2026-02-26", // on time
  },
  {
    id:               "t8",
    title:            "Implementar pantalla de bienvenida",
    description:      "Desarrollar el componente de pantalla inicial con animación de entrada.",
    project_id:       "2",
    assigned_to:      "Dan Torres",
    estimated_time:   5,
    actual_time:      4,
    status:           "review",
    type:             "task",
    priority:         "high",
    target_end_date:  "2026-03-18",
    start_date:       "2026-03-05",
  },
  {
    id:               "t9",
    title:            "Implementar paso de configuración de perfil",
    description:      "Formulario de datos básicos del usuario durante el onboarding.",
    project_id:       "2",
    assigned_to:      "Carol White",
    estimated_time:   4,
    actual_time:      0,
    status:           "in_progress",
    type:             "task",
    priority:         "medium",
    target_end_date:  "2026-03-25",
    start_date:       "2026-03-12",
  },
  {
    id:               "t10",
    title:            "Integrar tracking de eventos de onboarding",
    description:      "Enviar eventos de analytics para cada paso completado del flujo.",
    project_id:       "2",
    assigned_to:      "Dan Torres",
    estimated_time:   3,
    actual_time:      0,
    status:           "backlog",
    type:             "task",
    priority:         "low",
    target_end_date:  "2026-04-01",
  },

  // ── Project 3: Refactor sistema de pagos ──────────────────────────────────
  {
    id:               "t11",
    title:            "Integrar nuevo gateway de pagos",
    description:      "Implementar la conexión con el nuevo proveedor y manejar webhooks.",
    project_id:       "3",
    assigned_to:      "Eva Chen",
    estimated_time:   10,
    actual_time:      11,
    status:           "ready_to_release",
    type:             "task",
    priority:         "urgent",
    target_end_date:  "2026-03-17",
    start_date:       "2026-02-25",
  },
  {
    id:               "t12",
    title:            "Migrar datos de suscripciones existentes",
    description:      "Script de migración de datos de clientes al nuevo sistema de pagos.",
    project_id:       "3",
    assigned_to:      "Dan Torres",
    estimated_time:   6,
    actual_time:      6,
    status:           "ready_to_release",
    type:             "task",
    priority:         "high",
    target_end_date:  "2026-03-16",
    start_date:       "2026-03-01",
  },
  {
    id:               "t13",
    title:            "QA — pruebas de regresión de pagos",
    description:      "Ejecutar suite completa de pruebas de integración y regresión antes del release.",
    project_id:       "3",
    assigned_to:      "Eva Chen",
    estimated_time:   5,
    actual_time:      4,
    status:           "review",
    type:             "bug",
    priority:         "urgent",
    target_end_date:  "2026-03-19",
    start_date:       "2026-03-10",
  },
  {
    id:               "t14",
    title:            "Documentar API de pagos v3",
    description:      "Actualizar la documentación interna y externa con los nuevos endpoints.",
    project_id:       "3",
    assigned_to:      "Dan Torres",
    estimated_time:   3,
    actual_time:      0,
    status:           "backlog",
    type:             "task",
    priority:         "low",
    target_end_date:  "2026-04-08",
  },
];
