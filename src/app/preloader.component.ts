import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreloaderService } from './preloader.service';

@Component({
  selector: 'app-preloader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (preloader.loading$ | async) {
      <div class="preloader-overlay">
        <div class="preloader-spinner">
          <svg width="60" height="60" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
        </div>
      </div>
    }
  `,
  styles: [`
    .preloader-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preloader-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .path {
      stroke: #1976d2;
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
  `]
})
export class PreloaderComponent {
  constructor(public preloader: PreloaderService) {}
}
