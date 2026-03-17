export type BugSeverity = "minor" | "major" | "critical";

export interface Bug {
  id:          string;
  title:       string;
  description: string;
  project_id:  string;
  severity:    BugSeverity;
}

export const MOCK_BUGS: Bug[] = [
  // ── Project 1: Migración a Kubernetes ─────────────────────────────────────
  {
    id:          "b1",
    title:       "Pod reinicia aleatoriamente en producción",
    description: "El pod del servicio de autenticación se reinicia sin motivo aparente cada ~6 horas en el cluster de producción.",
    project_id:  "1",
    severity:    "critical",
  },
  {
    id:          "b2",
    title:       "ConfigMap no se recarga sin reinicio manual",
    description: "Los cambios en el ConfigMap requieren reiniciar el deployment manualmente para que surtan efecto.",
    project_id:  "1",
    severity:    "major",
  },
  {
    id:          "b3",
    title:       "Logs de staging mezclados con producción en Grafana",
    description: "El dashboard de Grafana muestra métricas de staging en el panel de producción por una etiqueta incorrecta.",
    project_id:  "1",
    severity:    "minor",
  },
  {
    id:          "b4",
    title:       "Health check falla en nodos con alta carga",
    description: "El liveness probe falla cuando el CPU supera el 80%, causando reinicios innecesarios del contenedor.",
    project_id:  "1",
    severity:    "major",
  },

  // ── Project 2: Nuevo onboarding de usuarios ────────────────────────────────
  {
    id:          "b5",
    title:       "Pantalla de bienvenida se congela en iOS 16",
    description: "La animación de entrada de la pantalla inicial causa un congelamiento de 2-3 segundos en dispositivos iOS 16.",
    project_id:  "2",
    severity:    "critical",
  },
  {
    id:          "b6",
    title:       "Botón 'Continuar' no responde en pantalla de perfil",
    description: "En pantallas con altura menor a 700px el botón queda oculto detrás del teclado virtual y no es accesible.",
    project_id:  "2",
    severity:    "major",
  },
  {
    id:          "b7",
    title:       "Texto de bienvenida truncado en idioma alemán",
    description: "El string localizado en alemán supera el ancho del contenedor y se trunca con puntos suspensivos.",
    project_id:  "2",
    severity:    "minor",
  },

  // ── Project 3: Refactor sistema de pagos ──────────────────────────────────
  {
    id:          "b8",
    title:       "Pago duplicado al hacer doble clic en 'Confirmar'",
    description: "Si el usuario hace doble clic rápido en el botón de confirmación, se procesan dos cargos. El botón no se deshabilita correctamente.",
    project_id:  "3",
    severity:    "critical",
  },
  {
    id:          "b9",
    title:       "Webhook de Stripe ignora eventos de reembolso",
    description: "Los eventos de tipo 'charge.refunded' de Stripe no se procesan correctamente y el estado de la orden no se actualiza.",
    project_id:  "3",
    severity:    "major",
  },
  {
    id:          "b10",
    title:       "Formato de moneda incorrecto para EUR",
    description: "Las cantidades en euros se muestran con separador de miles incorrecto (punto en vez de coma) en el recibo de pago.",
    project_id:  "3",
    severity:    "minor",
  },
];
