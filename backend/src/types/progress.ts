export interface WatchProgress {
    episode_id: number;
    position_seconds: number;
    completed: number; // SQLite stores 0/1
    updated_at: string;
}
