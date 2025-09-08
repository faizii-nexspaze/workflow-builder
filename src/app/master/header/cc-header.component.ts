import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'header[cc-header]',
  templateUrl: './cc-header.component.html',
  styleUrls: [ './cc-header.component.scss' ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive
  ]
})
export class CcHeaderComponent {

  public onGitHubClick(): void {
    window.open('https://github.com/Foblex/f-flow-example', '_blank');
  }
}

