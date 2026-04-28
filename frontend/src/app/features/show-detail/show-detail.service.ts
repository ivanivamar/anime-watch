import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface EpisodeWithProgress {
    id: number;
    season: number;
    episode: number;
    title: string | null;
    duration_seconds: number | null;
    mime_type: string;
    position_seconds: number | null;
    completed: number | null;
    progress_updated_at: string | null;
}

export interface ShowDetail {
    id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
    description: string | null;
    episodes: EpisodeWithProgress[];
}

@Injectable({ providedIn: 'root' })
export class ShowDetailService {
    private readonly http = inject(HttpClient);

    getShow(id: number): Observable<ShowDetail> {
        return this.http.get<ShowDetail>(`/api/shows/${id}`);
    }
}
