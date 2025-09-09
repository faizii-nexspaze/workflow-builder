import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'workflow-sidebar',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div style="width: 100%; background: #f7f7f7; border-left: 1px solid #e0e0e0; display: flex; flex-direction: column; height: 100%;">
      <!-- Scrollable content area -->
      <div style="flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 24px 20px 10px 20px; display: flex; flex-direction: column; gap: 18px;">
        <!-- Workflow/Card Header -->
        <div style="background: #fff; border-radius: 8px; box-shadow: var(--shadow); padding: 20px 18px 14px 18px; margin-bottom: 0; display: flex; flex-direction: column; gap: 10px;">
          <div class="text-lg fw-bold" style="color: var(--blue3); margin-bottom: 4px; letter-spacing: 0.01em;">
            {{ workflowName || 'Workflow Name' }}
          </div>
          <div class="text-sm fw-normal" style="color: var(--gray5); min-height: 32px;">
            {{ workflowDescription || 'Workflow description will appear here.' }}
          </div>
          @if (typeof stepNodeId === 'string' && stepNodeId) {
            <button (click)="deleteStep.emit(stepNodeId!)" class="btn btn-danger mt-2 ms-auto" aria-label="Delete Step">Delete</button>
          }
        </div>
        <!-- Step Details Card -->
        @if (stepNode) {
          <div style="background: #fff; border-radius: 8px; box-shadow: var(--shadow); padding: 20px 18px; margin-bottom: 0;">
            <div class="text-md fw-medium mb-2" style="color: var(--gray3);">Step Details</div>
            @if (getSchemaFields(stepNode.step_master?.input_schema).length > 0) {
              <div class="text-sm fw-medium mb-1" style="color: var(--blue3);">Input Schema</div>
              <form [formGroup]="inputForm" (ngSubmit)="onSubmitInputForm()" autocomplete="off">
                @for (field of getSchemaFields(stepNode.step_master?.input_schema); track field.name) {
                  <div class="mb-2">
                    <label [for]="'input-' + field.name" class="text-xs fw-medium mb-1" style="color: var(--gray6);">{{ field.name }}</label>
                    <input
                      [id]="'input-' + field.name"
                      [type]="field.type === 'number' ? 'number' : 'text'"
                      [formControlName]="field.name"
                      class="form-control text-sm rounded"
                      style="width: 100%; padding: 6px 10px; border: 1px solid var(--gray10); background: var(--gray14);"
                    />
                  </div>
                }
                <button type="submit" class="btn btn-primary mt-2" aria-label="Submit Input">Submit</button>
              </form>
            }
            @if (getSchemaFields(stepNode.step_master?.output_schema).length > 0) {
              <div class="text-sm fw-medium mt-2 mb-1" style="color: var(--blue3);">Output Schema</div>
              @for (field of getSchemaFields(stepNode.step_master?.output_schema); track field.name) {
                <div class="d-flex align-items-center mb-1">
                  <span class="text-xs" style="min-width: 110px; color: var(--gray6);">{{ field.name }}</span>
                  <span class="rounded" style="background: var(--blue12); color: var(--blue3); padding: 2px 8px; font-size: 13px; margin-left: 8px;">{{ field.type }}</span>
                </div>
              }
            }
          </div>
        }
        <!-- Log/Empty State Card -->
        <div style="background: #fff; border-radius: 8px; box-shadow: var(--shadow); padding: 20px 18px; min-height: 120px; display: flex; align-items: center; justify-content: center; color: var(--gray8); font-size: 15px;">
          <div style="text-align: center; width: 100%;">
            <div class="text-xl mb-1" style="opacity: 0.5;">🖥️</div>
            <div>Live logs and workflow activity<br>will appear here in the future.</div>
          </div>
        </div>
      </div>
      <!-- Button group: always at the bottom, sticky for accessibility -->
      <div style="display: flex; gap: 16px; justify-content: center; padding: 20px 0 20px 0; border-top: 1px solid #e0e0e0; background: #f7f7f7; position: sticky; bottom: 0; z-index: 2;">
        <button class="btn btn-primary fw-medium text-md px-4" aria-label="Start Workflow" tabindex="0">Start</button>
        @if (!isStopped) {
          <button class="btn btn-danger fw-medium text-md px-4" (click)="isStopped = true" aria-label="Stop Workflow" tabindex="0">Stop</button>
        } @else {
          <button class="btn btn-primary fw-medium text-md px-4" (click)="isStopped = false" aria-label="Continue Workflow" tabindex="0">Continue</button>
        }
        <button class="btn btn-secondary fw-medium text-md px-4" aria-label="Reset Workflow" tabindex="0">Reset</button>
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
