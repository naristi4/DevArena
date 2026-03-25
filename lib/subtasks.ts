// ─── Subtask data layer ────────────────────────────────────────────────────────
// Subtasks are execution-level breakdowns of a Task.
// Timeline and priority are managed at the Task level only.

export type SubtaskStatus = "todo" | "in_progress" | "ready_to_be_deployed" | "done";

export interface Subtask {
  id:            string;
  task_id:       string;   // FK → Task.id
  title:         string;
  description:   string;
  status:        SubtaskStatus;
  assigned_user: string;   // user display name
}

export const MOCK_SUBTASKS: Subtask[] = [
  // ── Task t1: Design new cluster architecture ──────────────────────────────
  {
    id:            "st-001",
    task_id:       "t1",
    title:         "Document current cluster topology",
    description:   "Create a diagram of the existing cluster setup before migration.",
    status:        "done",
    assigned_user: "Alice Johnson",
  },
  {
    id:            "st-002",
    task_id:       "t1",
    title:         "Define target node pools and resource quotas",
    description:   "Specify CPU/memory limits for each namespace in the new design.",
    status:        "in_progress",
    assigned_user: "Dan Torres",
  },
  {
    id:            "st-003",
    task_id:       "t1",
    title:         "Review design with platform team",
    description:   "Schedule a review session and incorporate feedback.",
    status:        "todo",
    assigned_user: "Alice Johnson",
  },
  // ── Task t2: Set up Helm charts ────────────────────────────────────────────
  {
    id:            "st-004",
    task_id:       "t2",
    title:         "Create base Helm chart scaffold",
    description:   "Initialize the chart directory structure with templates and values.yaml.",
    status:        "done",
    assigned_user: "Bob Smith",
  },
  {
    id:            "st-005",
    task_id:       "t2",
    title:         "Write deployment and service templates",
    description:   "Parameterize replicas, image tags, ports, and resource limits.",
    status:        "in_progress",
    assigned_user: "Bob Smith",
  },
  // ── Task t7: User flow mockups ─────────────────────────────────────────────
  {
    id:            "st-006",
    task_id:       "t7",
    title:         "Map out happy-path onboarding steps",
    description:   "List every screen a new user encounters from sign-up to first action.",
    status:        "done",
    assigned_user: "Carol White",
  },
  {
    id:            "st-007",
    task_id:       "t7",
    title:         "Design error and edge-case screens",
    description:   "Mockup for invalid inputs, network errors, and retry states.",
    status:        "done",
    assigned_user: "Carol White",
  },
  {
    id:            "st-008",
    task_id:       "t7",
    title:         "Get stakeholder sign-off on mockups",
    description:   "Present to PM and collect approval or change requests.",
    status:        "todo",
    assigned_user: "Dan Torres",
  },
  // ── Task t11: Payment Gateway Integration ──────────────────────────────────
  {
    id:            "st-009",
    task_id:       "t11",
    title:         "Integrate Stripe SDK and configure webhooks",
    description:   "Install stripe-node, set up webhook endpoint, handle payment_intent events.",
    status:        "in_progress",
    assigned_user: "Eva Chen",
  },
  {
    id:            "st-010",
    task_id:       "t11",
    title:         "Write unit tests for payment flows",
    description:   "Cover success, failure, and refund scenarios with mocked Stripe responses.",
    status:        "todo",
    assigned_user: "Eva Chen",
  },
];
