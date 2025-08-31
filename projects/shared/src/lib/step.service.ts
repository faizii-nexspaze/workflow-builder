import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Step {
  step_id: string;
  step_name: string;
  step_description?: string;
  input_schema?: object;
  output_schema?: object;
  step_type: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class StepService {
  private stepsSubject = new BehaviorSubject<Step[]>([
    {
      step_id: '1',
      step_name: 'Validate Input',
      step_description: 'Validates the input data',
      input_schema: { type: 'object', properties: { name: { type: 'string' } } },
      output_schema: { type: 'object', properties: { valid: { type: 'boolean' } } },
      step_type: 'workflow_builder_step',
      category: 'Validation'
    },
    {
      step_id: '2',
      step_name: 'Transform Data',
      step_description: 'Transforms input to required format',
      input_schema: { type: 'object', properties: { value: { type: 'number' } } },
      output_schema: { type: 'object', properties: { result: { type: 'number' } } },
      step_type: 'workflow_builder_step',
      category: 'Transformation'
    },
    {
      step_id: '3',
      step_name: 'Send Notification',
      step_description: 'Sends a notification to user',
      input_schema: { type: 'object', properties: { userId: { type: 'string' } } },
      output_schema: { type: 'object', properties: { sent: { type: 'boolean' } } },
      step_type: 'workflow_builder_step',
      category: 'Notification'
    }
  ]);

  getSteps(): Observable<Step[]> {
    return this.stepsSubject.asObservable();
  }

  getCurrentSteps(): Step[] {
    return this.stepsSubject.value;
  }

  addStep(step: Step) {
    this.stepsSubject.next([step, ...this.stepsSubject.value]);
  }

  updateStep(index: number, updated: Step) {
    const steps = [...this.stepsSubject.value];
    steps[index] = { ...updated };
    this.stepsSubject.next(steps);
  }

  removeStep(index: number) {
    const steps = [...this.stepsSubject.value];
    steps.splice(index, 1);
    this.stepsSubject.next(steps);
  }
}
