import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'workflow-sidebar',
  standalone: true,
  template: `
    <div style="width: 100%; background: #f7f7f7; border-left: 1px solid #e0e0e0; display: flex; flex-direction: column; height: 100%;">
      <div style="padding: 20px 20px 10px 20px; height: 100%; display: flex; flex-direction: column;">
        <div style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 18px 16px 12px 16px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 18px; font-weight: 600; color: #1976d2; margin-bottom: 6px;">
            {{ workflowName || 'Workflow Name' }}
          </div>
          <div style="font-size: 14px; color: #555; min-height: 32px;">
            {{ workflowDescription || 'Workflow description will appear here.' }}
          </div>
          @if (typeof stepNodeId === 'string' && stepNodeId) {
            <button (click)="deleteStep.emit(stepNodeId!)" style="margin-top: 8px; align-self: flex-end; background: #e53935; color: #fff; border: none; border-radius: 4px; padding: 6px 16px; font-size: 14px; cursor: pointer;">Delete</button>
          }
        </div>
        <div style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 18px 16px; min-height: 180px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 15px;">
          <div style="text-align: center; width: 100%;">
            <div style="font-size: 22px; margin-bottom: 8px;">
              <span style="opacity: 0.5;">🖥️</span>
            </div>
            <div>Live logs and workflow activity<br>will appear here in the future.</div>
          </div>
        </div>
        <!-- Button group: always visible below log screen -->
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
          <button style="background: #1976d2; color: #fff; border: none; border-radius: 4px; padding: 8px 22px; font-size: 15px; font-weight: 500; cursor: pointer;">Start</button>
          @if (!isStopped) {
            <button (click)="isStopped = true" style="background: #e53935; color: #fff; border: none; border-radius: 4px; padding: 8px 22px; font-size: 15px; font-weight: 500; cursor: pointer;">Stop</button>
          } @else {
            <button (click)="isStopped = false" style="background: #43a047; color: #fff; border: none; border-radius: 4px; padding: 8px 22px; font-size: 15px; font-weight: 500; cursor: pointer;">Continue</button>
          }
          <button style="background: #757575; color: #fff; border: none; border-radius: 4px; padding: 8px 22px; font-size: 15px; font-weight: 500; cursor: pointer;">Reset</button>
        </div>
      </div>
    </div>
  `
})
export class WorkflowSidebarComponent {
  @Input() workflowName: string = '';
  @Input() workflowDescription: string = '';
  @Input() stepNodeId: string | null = null;
  @Output() deleteStep = new EventEmitter<string>();
  isStopped = false;
}
