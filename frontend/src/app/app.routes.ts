import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'library', pathMatch: 'full' },
    {
        path: 'library',
        loadComponent: () =>
            import('./features/library/library.component').then((m) => m.LibraryComponent),
    },
    {
        path: 'watch/:episodeId',
        loadComponent: () =>
            import('./features/watch/watch.component').then((m) => m.WatchComponent),
    },
];
