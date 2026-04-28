import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../theme/theme.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
    private readonly themeService = inject(ThemeService);
    readonly theme = this.themeService.theme;

    toggleTheme(): void {
        this.themeService.toggle();
    }
}
