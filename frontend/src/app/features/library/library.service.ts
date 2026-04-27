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

@Injectable({ providedIn: 'root' })
export class LibraryService {
    private readonly http = inject(HttpClient);

    getShows(): Observable<ShowSummary[]> {
        return this.http.get<ShowSummary[]>('/api/shows');
    }
}
