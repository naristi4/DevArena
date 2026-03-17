export interface AppNotification {
  id:         string;
  type:       "mention" | "weekly_awards";
  title?:     string;    // weekly_awards: headline shown above the message
  message:    string;
  taskId?:    string;    // mention only
  projectId?: string;    // mention only
  from?:      string;    // mention only — who wrote the comment
  to?:        string;    // mention only — the mentioned user's name
  link?:      string;    // weekly_awards: destination URL on click
  at:         string;    // ISO timestamp
  read:       boolean;
}
