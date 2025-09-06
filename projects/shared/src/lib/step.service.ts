import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';

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
  private stepsSubject = new BehaviorSubject<Step[]>([]);

  constructor(private http: HttpClient) {
    this.fetchStepsFromApi();
  }

  private fetchStepsFromApi() {
    const url = `${environment.apiBaseUrl}/workflow-builder/step`;
    this.http.get<any>(url).subscribe({
      next: (data) => {
        console.log('[StepService] API response:', data);
        let categories = Array.isArray(data) ? data : (Array.isArray(data?.steps) ? data.steps : []);
        const steps: Step[] = (categories || []).flatMap((cat: any) =>
          (cat.steps || []).map((step: any) => ({
            ...step,
            category: step.category || cat.category_name || 'Uncategorized'
          }))
        );
        console.log('[StepService] Flattened steps:', steps);
        this.stepsSubject.next(steps);
      },
      error: (err) => {
        console.error('[StepService] API error:', err);
        this.stepsSubject.next([]);
      }
    });
  }


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

  // add step to workflow
  addStepToWorkflow(workflowId: string, data: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/workflow-builder/step-node/${workflowId}/nodes`, data);
  }


  // update step node (e.g., position, label, etc.)
  updateStepNode(stepNodeId: string, data: any): Observable<any> {
    return this.http.patch(`${environment.apiBaseUrl}/workflow-builder/step-node/node/${stepNodeId}`, data);
  }

    // add step to workflow
  connectStepNodes(workflowId: string, data: any): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}/workflow-builder/step-edge/${workflowId}/edges`, data);
  }

  // update step edge (e.g., position, label, etc.)
  updateStepEdge(stepEdgeId: string, data: any): Observable<any> {
    return this.http.patch(`${environment.apiBaseUrl}/workflow-builder/step-edge/edge/${stepEdgeId}`, data);
  }

  // delete step node
  deleteStepNode(stepNodeId: string): Observable<any> {
    return this.http.delete(`${environment.apiBaseUrl}/workflow-builder/step-node/node/${stepNodeId}`);
  }
}
