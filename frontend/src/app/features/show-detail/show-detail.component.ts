import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
    ShowDetailService,
    type EpisodeWithProgress,
    type ShowDetail,
} from './show-detail.service';

@Component({
    selector: 'app-show-detail',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './show-detail.component.html',
    styleUrl: './show-detail.component.css',
})
export class ShowDetailComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly showService = inject(ShowDetailService);

    readonly show = signal<ShowDetail | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    // Episodes grouped by season, sorted by season number
    readonly seasons = computed((): [number, EpisodeWithProgress[]][] => {
        const eps = this.show()?.episodes ?? [];
        const map = new Map<number, EpisodeWithProgress[]>();
        for (const ep of eps) {
            const bucket = map.get(ep.season) ?? [];
            bucket.push(ep);
            map.set(ep.season, bucket);
        }
        return [...map.entries()].sort(([a], [b]) => a - b);
    });

    // Most recently watched in-progress episode for the continue-watching button
    readonly resumeEpisode = computed((): EpisodeWithProgress | null => {
        const eps = this.show()?.episodes ?? [];
        return (
            eps
                .filter((ep) => (ep.position_seconds ?? 0) > 30 && ep.completed !== 1)
                .sort((a, b) =>
                    (b.progress_updated_at ?? '').localeCompare(a.progress_updated_at ?? ''),
                )[0] ?? null
        );
    });

    ngOnInit(): void {
        const id = parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10);
        if (isNaN(id)) {
            this.error.set('Invalid show ID.');
            this.loading.set(false);
            return;
        }
        this.showService.getShow(id).subscribe({
            next: (show) => {
                this.show.set(show);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('Failed to load show. Is the backend running?');
                this.loading.set(false);
            },
        });
    }

    pad(n: number): string {
        return String(n).padStart(2, '0');
    }

    formatDuration(seconds: number | null): string {
        if (!seconds) return '—';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    progressPercent(ep: EpisodeWithProgress): number {
        if (!ep.position_seconds || !ep.duration_seconds) return 0;
        return Math.min(100, Math.round((ep.position_seconds / ep.duration_seconds) * 100));
    }
}
