import { Routes } from '@angular/router';
import { StepListComponent } from './step-list/step-list.component';
import { StepCreateComponent } from './step-create/step-create.component';
import { StepEditComponent } from './step-edit/step-edit.component';

export const stepmasterRoutes: Routes = [
  { path: '', component: StepListComponent },
  { path: 'create', component: StepCreateComponent },
  { path: 'edit/:id', component: StepEditComponent }
];
