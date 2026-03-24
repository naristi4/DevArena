export type PipelineStatus =
  | "opportunity"
  | "ideation"
  | "technical_design"
  | "active_development"
  | "release"
  | "iteration"
  | "clean_up"
  | "completed";

// ─── Stage Configuration ───────────────────────────────────────────────────────

export interface StageConfig {
  id:         PipelineStatus;
  label:      string;       // display name (editable in Settings)
  inActive:   boolean;      // counts toward active project KPIs
  inWip:      boolean;      // counts as WIP (in active development)
  inRelevant: boolean;      // shown in pipeline distribution chart
}

export const PIPELINE_STAGE_CONFIG: StageConfig[] = [
  { id: "opportunity",        label: "Opportunity",     inActive: true,  inWip: false, inRelevant: false },
  { id: "ideation",           label: "Ideation",        inActive: true,  inWip: false, inRelevant: true  },
  { id: "technical_design",   label: "Tech Design",     inActive: true,  inWip: false, inRelevant: true  },
  { id: "active_development", label: "In Development",  inActive: true,  inWip: true,  inRelevant: true  },
  { id: "release",            label: "Release",         inActive: true,  inWip: true,  inRelevant: true  },
  { id: "iteration",          label: "Iteration",       inActive: true,  inWip: true,  inRelevant: true  },
  { id: "clean_up",           label: "Clean Up",        inActive: true,  inWip: false, inRelevant: true  },
  { id: "completed",          label: "Completed",       inActive: false, inWip: false, inRelevant: false },
];

export type PipelineImpact =
  | "Eficiencias/margen"
  | "Calidad"
  | "Product Market Fit"
  | "Saldar deuda/sistematización";

export interface Attachment {
  id:          string;
  type:        "file" | "link";  // "file" = uploaded file, "link" = external URL
  file_name:   string;           // display name
  file_url:    string;           // storage URL (files) or external URL (links)
  uploaded_by: string;
  uploaded_at: string;           // ISO datetime
}

export interface PipelineItem {
  id:                      string;
  title:                   string;
  description:             string;
  status:                  PipelineStatus;
  squad:                   string;
  impact:                  PipelineImpact;
  created_by:              string;
  created_at:              string;           // ISO datetime
  prd_url:                 string;
  odd_url:                 string;
  trd_url:                 string;
  attachments:             Attachment[];
  start_date:       string;           // "YYYY-MM-DD"
  target_end_date:  string;           // "YYYY-MM-DD" — planned delivery
  completion_date?: string;           // "YYYY-MM-DD" — actual completion (set when done)
}

// ─── Mock deletion support (in-memory; resets on server restart) ─────────────

const _deletedProjectIds = new Set<string>();

/** Returns all pipeline items excluding soft-deleted ones. */
export function getMockPipelineItems(): PipelineItem[] {
  return MOCK_PIPELINE_ITEMS.filter((p) => !_deletedProjectIds.has(p.id));
}

/** Soft-deletes a project by ID. Resets on server restart (mock only). */
export function deleteProjectById(id: string): void {
  _deletedProjectIds.add(id);
}

export const MOCK_PIPELINE_ITEMS: PipelineItem[] = [
  // ── Opportunity stage (from old Opportunities: idea) ───────────────────────
  {
    id:                      "o1",
    title:                   "Rediseño de onboarding",
    description:             "Crear un flujo de bienvenida más claro que ayude a los nuevos usuarios a entender el valor del producto.",
    status:                  "opportunity",
    squad:                   "",
    impact:                  "Product Market Fit",
    created_by:              "Dan Torres",
    created_at:              "2026-02-15T00:00:00.000Z",
    prd_url:                 "",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "",
    target_end_date:  "",
  },
  {
    id:                      "o2",
    title:                   "Dashboard de métricas de calidad",
    description:             "Centralizar los indicadores de calidad del producto en un panel visible para todo el equipo.",
    status:                  "opportunity",
    squad:                   "",
    impact:                  "Calidad",
    created_by:              "Carol White",
    created_at:              "2026-03-01T00:00:00.000Z",
    prd_url:                 "",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "",
    target_end_date:  "",
  },

  // ── Ideation stage (from old Opportunities: exploring + on_hold project) ───
  {
    id:                      "o3",
    title:                   "Optimizar flujo de checkout",
    description:             "Reducir pasos del proceso de compra para mejorar la tasa de conversión y disminuir el abandono de carrito.",
    status:                  "ideation",
    squad:                   "Growth Squad",
    impact:                  "Eficiencias/margen",
    created_by:              "Alice Johnson",
    created_at:              "2026-02-10T00:00:00.000Z",
    prd_url:                 "",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "",
    target_end_date:  "",
  },
  {
    id:                      "o4",
    title:                   "Migrar sistema de autenticación legacy",
    description:             "Reemplazar el sistema de auth actual por una solución moderna para liberar tiempo de operaciones.",
    status:                  "ideation",
    squad:                   "Core Squad",
    impact:                  "Saldar deuda/sistematización",
    created_by:              "Bob Smith",
    created_at:              "2026-02-25T00:00:00.000Z",
    prd_url:                 "",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "",
    target_end_date:  "",
  },
  {
    id:                      "5",
    title:                   "Campaña de activación Q1",
    description:             "Implementar mecánicas de activación y retención para el segmento de usuarios freemium durante el primer trimestre.",
    status:                  "ideation",
    squad:                   "Growth Squad",
    impact:                  "Product Market Fit",
    created_by:              "Carol White",
    created_at:              "2026-01-28T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/campana-q1",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "2026-02-01",
    target_end_date:  "2026-03-31",
  },

  // ── Technical Design (from old Projects: PRD in progress) ─────────────────
  {
    id:                      "2",
    title:                   "Nuevo onboarding de usuarios",
    description:             "Rediseñar el flujo de bienvenida para nuevos usuarios, reduciendo el tiempo hasta el primer valor percibido.",
    status:                  "technical_design",
    squad:                   "Growth Squad",
    impact:                  "Product Market Fit",
    created_by:              "Carol White",
    created_at:              "2026-02-20T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/onboarding",
    odd_url:                 "",
    trd_url:                 "",
    attachments:             [],
    start_date:              "2026-03-01",
    target_end_date:  "2026-05-15",
  },

  // ── Active Development ─────────────────────────────────────────────────────
  {
    id:                      "1",
    title:                   "Migración a Kubernetes",
    description:             "Migrar toda la infraestructura de contenedores a Kubernetes para mejorar la escalabilidad y resiliencia del sistema.",
    status:                  "active_development",
    squad:                   "Platform Squad",
    impact:                  "Saldar deuda/sistematización",
    created_by:              "Alice Johnson",
    created_at:              "2026-01-10T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/kubernetes",
    odd_url:                 "https://example.com/odd/kubernetes",
    trd_url:                 "https://example.com/trd/kubernetes",
    attachments:             [
      {
        id:          "att-1",
        type:        "file" as const,
        file_name:   "architecture-diagram.pdf",
        file_url:    "https://example.com/files/architecture-diagram.pdf",
        uploaded_by: "Alice Johnson",
        uploaded_at: "2026-01-20T10:30:00.000Z",
      },
    ],
    start_date:              "2026-01-15",
    target_end_date:  "2026-04-30",
  },
  {
    id:                      "7",
    title:                   "Sistema de notificaciones push",
    description:             "Implementar notificaciones push web y móvil para alertas de actividad relevante, con preferencias de usuario.",
    status:                  "active_development",
    squad:                   "Growth Squad",
    impact:                  "Product Market Fit",
    created_by:              "Carol White",
    created_at:              "2026-02-01T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/notificaciones",
    odd_url:                 "https://example.com/odd/notificaciones",
    trd_url:                 "https://example.com/trd/notificaciones",
    attachments:             [],
    start_date:              "2026-02-15",
    target_end_date:  "2026-05-01",
  },

  // ── Release ────────────────────────────────────────────────────────────────
  {
    id:                      "3",
    title:                   "Refactor sistema de pagos",
    description:             "Reemplazar el gateway de pagos legacy por una solución moderna con soporte multi-moneda y mejores herramientas de reconciliación.",
    status:                  "release",
    squad:                   "Core Squad",
    impact:                  "Eficiencias/margen",
    created_by:              "Eva Chen",
    created_at:              "2025-11-15T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/pagos",
    odd_url:                 "https://example.com/odd/pagos",
    trd_url:                 "https://example.com/trd/pagos",
    attachments:             [
      {
        id:          "att-2",
        type:        "file" as const,
        file_name:   "payment-flow-diagram.png",
        file_url:    "https://example.com/files/payment-flow-diagram.png",
        uploaded_by: "Eva Chen",
        uploaded_at: "2025-12-05T14:15:00.000Z",
      },
      {
        id:          "att-3",
        type:        "file" as const,
        file_name:   "reconciliation-spec.docx",
        file_url:    "https://example.com/files/reconciliation-spec.docx",
        uploaded_by: "Bob Smith",
        uploaded_at: "2026-01-10T09:00:00.000Z",
      },
    ],
    start_date:              "2025-11-01",
    target_end_date:  "2026-03-20",
  },

  // ── Iteration ──────────────────────────────────────────────────────────────
  {
    id:                      "4",
    title:                   "Dashboard de métricas en tiempo real",
    description:             "Centralizar indicadores clave de producto y operaciones en un panel con actualizaciones en vivo para decisiones rápidas.",
    status:                  "iteration",
    squad:                   "Platform Squad",
    impact:                  "Calidad",
    created_by:              "Alice Johnson",
    created_at:              "2025-09-01T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/dashboard",
    odd_url:                 "https://example.com/odd/dashboard",
    trd_url:                 "https://example.com/trd/dashboard",
    attachments:             [],
    start_date:              "2025-09-01",
    target_end_date:  "2025-12-31",
  },

  // ── Completed ──────────────────────────────────────────────────────────────
  {
    id:                      "6",
    title:                   "API de integración con terceros",
    description:             "Desarrollar una API pública con documentación OpenAPI para permitir integraciones de partners y clientes enterprise.",
    status:                  "completed",
    squad:                   "Core Squad",
    impact:                  "Eficiencias/margen",
    created_by:              "Dan Torres",
    created_at:              "2025-06-01T00:00:00.000Z",
    prd_url:                 "https://example.com/prd/api",
    odd_url:                 "https://example.com/odd/api",
    trd_url:                 "https://example.com/trd/api",
    attachments:             [
      {
        id:          "att-4",
        type:        "file" as const,
        file_name:   "openapi-spec.pdf",
        file_url:    "https://example.com/files/openapi-spec.pdf",
        uploaded_by: "Dan Torres",
        uploaded_at: "2025-10-15T11:00:00.000Z",
      },
    ],
    start_date:      "2025-06-01",
    target_end_date: "2025-10-31",
    completion_date: "2025-10-28",   // delivered 3 days early
  },
];
