import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'workflow-sidebar',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule],
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
        <div *ngIf="stepNode" style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 18px 16px; margin-bottom: 18px;">
          <div style="font-size: 16px; font-weight: 500; color: #333; margin-bottom: 8px;">Step Details</div>
          <div *ngIf="getSchemaFields(stepNode.step_master?.input_schema).length > 0">
            <div style="font-size: 14px; font-weight: 500; color: #1976d2; margin-bottom: 4px;">Input Schema</div>
            <form [formGroup]="inputForm" (ngSubmit)="onSubmitInputForm()">
              <div *ngFor="let field of getSchemaFields(stepNode.step_master?.input_schema)" style="margin-bottom: 12px;">
                <label [for]="'input-' + field.name" style="display: block; font-size: 13px; color: #555; margin-bottom: 4px;">{{ field.name }}</label>
                <input
                  [id]="'input-' + field.name"
                  [type]="field.type === 'number' ? 'number' : 'text'"
                  [formControlName]="field.name"
                  style="width: 100%; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;"
                />
              </div>
              <button type="submit" style="background: #1976d2; color: #fff; border: none; border-radius: 4px; padding: 6px 18px; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 8px;">Submit</button>
            </form>
          </div>
          <div *ngIf="getSchemaFields(stepNode.step_master?.output_schema).length > 0">
            <div style="font-size: 14px; font-weight: 500; color: #1976d2; margin-top: 12px; margin-bottom: 4px;">Output Schema</div>
            <div *ngFor="let field of getSchemaFields(stepNode.step_master?.output_schema)">
              <div style="display: flex; align-items: center; margin-bottom: 6px;">
                <span style="min-width: 110px; color: #555;">{{ field.name }}</span>
                <span style="background: #e3eafc; color: #1976d2; border-radius: 4px; padding: 2px 8px; font-size: 13px; margin-left: 8px;">{{ field.type }}</span>
              </div>
            </div>
          </div>
        </div>
        <div style="background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 18px 16px; min-height: 120px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 15px;">
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
export class WorkflowSidebarComponent implements OnChanges {
  @Input() workflowName: string = '';
  @Input() workflowDescription: string = '';
  @Input() stepNodeId: string | null = null;
  @Input() stepNode: any = null;
  @Output() deleteStep = new EventEmitter<string>();
  isStopped = false;
  inputForm: FormGroup = this.fb.group({});

  constructor(private fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepNode'] && this.stepNode && this.stepNode.step_master) {
      this.buildInputForm();
    }
  }

  buildInputForm() {
    const fields = this.getSchemaFields(this.stepNode.step_master?.input_schema);
    const group: { [key: string]: FormControl } = {};
    for (const field of fields) {
      group[field.name] = new FormControl('');
    }
    this.inputForm = this.fb.group(group);
  }

  onSubmitInputForm() {
    if (this.inputForm.valid) {
      console.log('Input form values:', this.inputForm.value);
    }
  }

  getSchemaFields(schema: any): { name: string; type: string }[] {
    if (!schema) return [];
    // If schema is an array (new backend format)
    if (Array.isArray(schema)) {
      return schema.map((field: any) => ({
        name: field.name || '',
        type: field.type || 'unknown'
      }));
    }
    // If schema is an object with properties (old format)
    if (schema.properties) {
      return Object.entries(schema.properties).map(([name, val]: [string, any]) => ({
        name,
        type: val.type || 'unknown'
      }));
    }
    // If schema is an empty object or unknown
    return [];
  }
}
