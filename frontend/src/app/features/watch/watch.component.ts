import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WatchService, type EpisodeDetail } from './watch.service';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './watch.component.html',
  styleUrl: './watch.component.css',
})
export class WatchComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly watchService = inject(WatchService);

  @ViewChild('videoEl') private videoElRef!: ElementRef<HTMLVideoElement>;

  readonly episode = signal<EpisodeDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private savedPosition = 0;
  private completedMarked = false;
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const id = parseInt(params.get('episodeId') ?? '', 10);
        if (!isNaN(id)) this.loadEpisode(id);
      });
  }

  ngAfterViewInit(): void {
    // videoElRef is now available; loadEpisode callbacks are safe to use it
  }

  ngOnDestroy(): void {
    this.clearProgressInterval();
    this.saveCurrentProgress();
  }

  onMetadataLoaded(): void {
    const v = this.videoElRef.nativeElement;
    const pos = this.savedPosition;

    if (pos > 30 && isFinite(v.duration) && pos < v.duration - 60) {
      v.currentTime = pos;
    }

    this.startProgressInterval();
    v.play().catch(() => {
      // Autoplay blocked — user will click play manually
    });
  }

  onTimeUpdate(): void {
    if (this.completedMarked) return;
    const v = this.videoElRef.nativeElement;
    if (isFinite(v.duration) && v.duration - v.currentTime < 60) {
      this.completedMarked = true;
      this.saveCurrentProgress(true);
    }
  }

  onEnded(): void {
    this.clearProgressInterval();
    this.goToNextEpisode();
  }

  onVideoError(): void {
    this.error.set('Video failed to load. Check that the file exists and is in a supported format (mp4, webm, mkv).');
    this.clearProgressInterval();
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private loadEpisode(id: number): void {
    this.clearProgressInterval();
    this.completedMarked = false;
    this.loading.set(true);
    this.error.set(null);
    this.episode.set(null);

    if (this.videoElRef) {
      const v = this.videoElRef.nativeElement;
      v.pause();
      v.src = '';
    }

    forkJoin({
      episode: this.watchService.getEpisode(id),
      progress: this.watchService.getProgress(id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ episode, progress }) => {
        this.savedPosition = progress?.position_seconds ?? 0;
        this.episode.set(episode);
        this.loading.set(false);

        // setTimeout(0) lets Angular flush the current render cycle so the
        // video element is visible before we set src and call load()
        setTimeout(() => {
          const v = this.videoElRef.nativeElement;
          v.src = `/api/stream/${episode.id}`;
          v.load();
        });
      },
      error: () => {
        this.error.set('Failed to load episode. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  private startProgressInterval(): void {
    this.clearProgressInterval();
    this.progressInterval = setInterval(() => this.saveCurrentProgress(), 5000);
  }

  private clearProgressInterval(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private saveCurrentProgress(completed = false): void {
    const ep = this.episode();
    if (!ep || !this.videoElRef) return;
    const pos = Math.floor(this.videoElRef.nativeElement.currentTime);
    if (pos === 0) return;
    this.watchService
      .saveProgress(ep.id, pos, completed || this.completedMarked)
      .subscribe();
  }

  private goToNextEpisode(): void {
    const ep = this.episode();
    if (!ep) return;
    this.watchService.getNextEpisode(ep.id).subscribe({
      next: (next) => {
        if (next) this.router.navigate(['/watch', next.id]);
        // null means last episode — stay on page
      },
      error: () => {},
    });
  }
}
