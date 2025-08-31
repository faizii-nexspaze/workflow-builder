import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StepListComponent } from './step-list/step-list.component';
import { StepCreateComponent } from './step-create/step-create.component';
import { StepEditComponent } from './step-edit/step-edit.component';
import { stepmasterRoutes } from './stepmaster.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(stepmasterRoutes),
    StepListComponent,
    StepCreateComponent,
    StepEditComponent
  ]
})
export class StepmasterModule { }
