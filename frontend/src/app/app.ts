import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/sidebar/sidebar.component';
import { ThemeService } from './core/theme/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, SidebarComponent],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    // Inject the theme service eagerly so its constructor runs as early as
    // possible after bootstrap (sets `data-theme` from localStorage / system pref).
    private readonly _theme = inject(ThemeService);
}
