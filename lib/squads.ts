export interface Squad {
  squad_id:    string;
  name:        string;
  description: string;
  squad_lead?: string;  // name of the squad lead (matches User.name)
}

export const MOCK_SQUADS: Squad[] = [
  {
    squad_id:    "1",
    name:        "Platform Squad",
    description: "Core platform infrastructure and reliability.",
    squad_lead:  "Alice Johnson",
  },
  {
    squad_id:    "2",
    name:        "Growth Squad",
    description: "Product growth, acquisition, and engagement.",
    squad_lead:  "Carol White",
  },
  {
    squad_id:    "3",
    name:        "Core Squad",
    description: "Core product features and engineering foundations.",
    squad_lead:  "Dan Torres",
  },
];
