export interface ShowSummary {
    id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
    episode_count: number;
}

export interface EpisodeRow {
    id: number;
    season: number;
    episode: number;
    title: string | null;
    duration_seconds: number | null;
    mime_type: string;
    position_seconds: number | null;
    completed: number | null; // 0, 1, or null (no row)
    progress_updated_at: string | null;
}

export interface ShowDetail {
    id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
    description: string | null;
    episodes: EpisodeRow[];
}
