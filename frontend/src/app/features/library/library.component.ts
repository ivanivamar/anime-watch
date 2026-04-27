import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryService, type ShowSummary } from './library.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css',
})
export class LibraryComponent implements OnInit {
  private readonly library = inject(LibraryService);

  readonly shows = signal<ShowSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.library.getShows().subscribe({
      next: (shows) => {
        this.shows.set(shows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load library. Is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
