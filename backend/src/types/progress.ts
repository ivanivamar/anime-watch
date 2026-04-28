export interface WatchProgress {
    episode_id: number;
    position_seconds: number;
    completed: number; // SQLite stores 0/1
    updated_at: string;
}

export interface ContinueWatchingItem {
    episode_id: number;
    season: number;
    episode: number;
    episode_title: string | null;
    duration_seconds: number | null;
    position_seconds: number;
    show_id: number;
    show_title: string;
    updated_at: string;
}
