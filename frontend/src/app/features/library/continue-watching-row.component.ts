import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContinueWatchingItem } from './library.service';

@Component({
    selector: 'app-continue-watching-row',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './continue-watching-row.component.html',
    styleUrl: './continue-watching-row.component.scss',
})
export class ContinueWatchingRowComponent {
    readonly items = input.required<ContinueWatchingItem[]>();

    onThumbError(event: Event): void {
        (event.target as HTMLImageElement).style.display = 'none';
    }

    pad(n: number): string {
        return String(n).padStart(2, '0');
    }

    progressPercent(item: ContinueWatchingItem): number {
        if (!item.duration_seconds) return 0;
        return Math.min(100, Math.round((item.position_seconds / item.duration_seconds) * 100));
    }
}
