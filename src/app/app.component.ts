import {
  Component, OnInit
} from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { PreloaderComponent } from './preloader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    RouterOutlet,
    PreloaderComponent
  ]
})
export class AppComponent {

}
