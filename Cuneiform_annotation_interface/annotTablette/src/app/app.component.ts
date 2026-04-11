import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotTablette } from './annotable/annot-tablette/annot-tablette';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
  private mediaQueryList!: MediaQueryList;
  isDarkMode = false;
  icon_lummode !: string;

  constructor(
    private titleService:Title,
  )
  {
    if (this.isSystemDark() || localStorage.getItem('lummode')==='dark') {
      this.toggleDarkMode();
      this.isDarkMode = true;
      this.icon_lummode = "pi pi-sun";// déplacer pour reload automatique ...s
      localStorage.setItem('lummode', 'dark');
    }
    else {
      this.isDarkMode = false;
      this.icon_lummode = "pi pi-moon";
      localStorage.setItem('lummode', 'light');
    }
  }
  isSystemDark(): boolean {
    return window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches;
  }
  toggleDarkMode() {
    const element = document.querySelector('html');
    if (element) {
      element.classList.toggle('dark-mode');
      const currentBSDarkMode = element.getAttribute('data-bs-theme');
      if (currentBSDarkMode === null) {
        element.setAttribute('data-bs-theme', 'dark');
        }
      const newMode = currentBSDarkMode === 'dark' ? 'light' : 'dark';
      element.setAttribute('data-bs-theme',newMode);
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('lummode', newMode);
    }
  }

  ngOnInit () {
    this.titleService.setTitle("AnnotTablette");
    this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    // Écouter les changements de thème
    this.mediaQueryList.addEventListener('change', (event) => {
      this.toggleDarkMode();
    });
  }
  ngOnDestroy () {
    // Nettoyer l'écouteur
    this.mediaQueryList.removeEventListener('change', () => {});
  }
}
