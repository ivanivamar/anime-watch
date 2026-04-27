import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface EpisodeDetail {
  id: number;
  show_id: number;
  season: number;
  episode: number;
  title: string | null;
  duration_seconds: number | null;
  mime_type: string;
}

export interface SavedProgress {
  episode_id: number;
  position_seconds: number;
  completed: number;
  updated_at: string;
}

export interface NextEpisode {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class WatchService {
  private readonly http = inject(HttpClient);

  getEpisode(id: number): Observable<EpisodeDetail> {
    return this.http.get<EpisodeDetail>(`/api/episodes/${id}`);
  }

  getProgress(episodeId: number): Observable<SavedProgress> {
    return this.http.get<SavedProgress>(`/api/progress/${episodeId}`);
  }

  saveProgress(episodeId: number, positionSeconds: number, completed: boolean): Observable<void> {
    return this.http.post<void>('/api/progress', {
      episodeId,
      position_seconds: positionSeconds,
      completed: completed ? 1 : 0,
    });
  }

  getNextEpisode(episodeId: number): Observable<NextEpisode | null> {
    return this.http.get<NextEpisode | null>(`/api/episodes/${episodeId}/next`);
  }
}
