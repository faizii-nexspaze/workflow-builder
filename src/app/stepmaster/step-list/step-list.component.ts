
import { Component, OnInit, OnDestroy } from '@angular/core';
import { StepEditComponent } from '../step-edit/step-edit.component';
import { CommonModule, JsonPipe } from '@angular/common';
import { StepCreateComponent } from '../step-create/step-create.component';
import { StepService, Step } from '@step-shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-step-list',
  templateUrl: './step-list.component.html',
  styleUrls: ['./step-list.component.scss'],
  standalone: true,
  imports: [CommonModule, JsonPipe, StepCreateComponent, StepEditComponent]
})
export class StepListComponent implements OnInit, OnDestroy {
  steps: Step[] = [];
  private sub: Subscription = new Subscription();

  showCreateModal = false;
  showEditModal = false;
  editStepIndex: number | null = null;
  editStepData: any = null;

  constructor(private stepService: StepService) {}

  ngOnInit() {
    this.sub = this.stepService.getSteps().subscribe(steps => {
      this.steps = steps;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  openCreateModal() {
    this.showCreateModal = true;
  }
  closeCreateModal() {
    this.showCreateModal = false;
  }
  addStep(step: Step) {
    // Remove step_id if present, only send StepCreate fields
    const { step_id, ...stepData } = step;
    this.stepService.addStep(stepData).subscribe({
      next: () => {
        this.closeCreateModal();
      },
      error: () => {
        this.closeCreateModal();
      }
    });
  }

  openEditModal(step: Step, index: number) {
    this.editStepData = JSON.parse(JSON.stringify(step));
    this.editStepIndex = index;
    this.showEditModal = true;
  }
  closeEditModal() {
    this.showEditModal = false;
    this.editStepIndex = null;
    this.editStepData = null;
  }
  updateStep(updatedStep: Step) {
    if (this.editStepIndex !== null) {
      this.stepService.updateStep(this.editStepIndex, updatedStep);
    }
    this.closeEditModal();
  }
  // (no duplicate methods)
}
