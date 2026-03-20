export interface Squad {
  id:          string;
  name:        string;
  description: string;
  squad_lead?: string;        // display name
  leadId?:     string | null; // user id for API
}
