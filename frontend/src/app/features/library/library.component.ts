import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ContinueWatchingRowComponent } from './continue-watching-row.component';
import { LibraryService, type ContinueWatchingItem, type ShowSummary } from './library.service';

@Component({
    selector: 'app-library',
    standalone: true,
    imports: [RouterLink, ContinueWatchingRowComponent],
    templateUrl: './library.component.html',
    styleUrl: './library.component.scss',
})
export class LibraryComponent implements OnInit {
    onPosterError(event: Event): void {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    private readonly library = inject(LibraryService);

    readonly shows = signal<ShowSummary[]>([]);
    readonly continueWatching = signal<ContinueWatchingItem[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    ngOnInit(): void {
        forkJoin({
            shows: this.library.getShows(),
            continueWatching: this.library.getContinueWatching(),
        }).subscribe({
            next: ({ shows, continueWatching }) => {
                this.shows.set(shows);
                this.continueWatching.set(continueWatching);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('Failed to load library. Is the backend running?');
                this.loading.set(false);
            },
        });
    }
}
