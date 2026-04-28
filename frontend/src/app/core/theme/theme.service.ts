import { Injectable, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';

const STORAGE_KEY_THEME = 'anime-watch:theme';
const STORAGE_KEY_ACCENT = 'anime-watch:accent';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly _theme = signal<Theme>(this.readInitialTheme());
    readonly theme = this._theme.asReadonly();

    constructor() {
        // Apply once synchronously so the first paint after Angular boots
        // already reflects the user's saved theme (a small inline script in
        // index.html sets the attribute even earlier, before the bundle loads).
        this.applyTheme(this._theme());

        // Persist + re-apply whenever the signal changes.
        effect(() => {
            const t = this._theme();
            this.applyTheme(t);
            try {
                localStorage.setItem(STORAGE_KEY_THEME, t);
            } catch {
                // localStorage unavailable (private mode, sandbox); skip persist.
            }
        });

        // Restore a saved accent override, if any.
        try {
            const accent = localStorage.getItem(STORAGE_KEY_ACCENT);
            if (accent) document.documentElement.style.setProperty('--accent', accent);
        } catch {
            // no-op
        }
    }

    toggle(): void {
        this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
    }

    set(theme: Theme): void {
        this._theme.set(theme);
    }

    /**
     * Override the accent colour at runtime. Pass any valid CSS colour string.
     * Persists across reloads. Pass `null` to clear and fall back to the
     * theme default.
     */
    setAccent(color: string | null): void {
        if (color === null) {
            document.documentElement.style.removeProperty('--accent');
            try {
                localStorage.removeItem(STORAGE_KEY_ACCENT);
            } catch {}
            return;
        }
        document.documentElement.style.setProperty('--accent', color);
        try {
            localStorage.setItem(STORAGE_KEY_ACCENT, color);
        } catch {}
    }

    private readInitialTheme(): Theme {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_THEME);
            if (saved === 'light' || saved === 'dark') return saved;
        } catch {
            // localStorage unavailable; fall through to system preference.
        }
        return window.matchMedia?.('(prefers-color-scheme: light)').matches
            ? 'light'
            : 'dark';
    }

    private applyTheme(theme: Theme): void {
        document.documentElement.setAttribute('data-theme', theme);
    }
}
