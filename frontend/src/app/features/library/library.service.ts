import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface ShowSummary {
    id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
    episode_count: number;
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

@Injectable({ providedIn: 'root' })
export class LibraryService {
    private readonly http = inject(HttpClient);

    getShows(): Observable<ShowSummary[]> {
        return this.http.get<ShowSummary[]>('/api/shows');
    }

    getContinueWatching(): Observable<ContinueWatchingItem[]> {
        return this.http.get<ContinueWatchingItem[]>('/api/progress/continue');
    }
}
