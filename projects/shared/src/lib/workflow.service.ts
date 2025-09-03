import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './environment';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getWorkflows(): Observable<any> {
    return this.http.get(`${this.baseUrl}/workflow-builder/workflow`);
  }

  getWorkflowById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/workflow-builder/workflow/${id}`);
  }

  createWorkflow(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/workflow-builder/workflow`, data);
  }

  updateWorkflow(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/workflow-builder/workflow/${id}`, data);
  }

  deleteWorkflow(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/workflow-builder/workflow/${id}`);
  }
}
