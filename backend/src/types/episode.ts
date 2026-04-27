export interface Episode {
  id: number;
  show_id: number;
  season: number;
  episode: number;
  title: string | null;
  file_path: string;
  duration_seconds: number | null;
  mime_type: string;
  created_at: string;
}
