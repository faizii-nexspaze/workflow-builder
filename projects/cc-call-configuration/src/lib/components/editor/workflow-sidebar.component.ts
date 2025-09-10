import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'workflow-sidebar',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="nk-sidebar-card bg-light border-start border-2 border-primary d-flex flex-column h-100">
      <!-- Scrollable content area -->
      <div class="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
        <!-- Workflow/Card Header -->
        <div class="nk-card nk-card-bordered bg-white rounded-3 shadow-sm mb-0 p-0 d-flex flex-column">
          <div class="card-header bg-light border-bottom px-3 py-2 rounded-top-3">
            <span class="fw-semibold text-xs text-muted">
              {{ stepNode ? 'Step' : 'Workflow' }}
            </span>
          </div>
          <div class="card-body px-3 pt-3 pb-2 d-flex flex-column gap-2">
            <div class="mb-1" style="color:#7367f0; font-weight:500; font-size:1rem;">
              {{ workflowName || 'Workflow Name' }}
            </div>
            <div class="text-sm fw-normal text-muted min-h-32 mb-1">
              {{ workflowDescription || 'Workflow description will appear here.' }}
            </div>
            @if (typeof stepNodeId === 'string' && stepNodeId) {
              <div style="display:flex; justify-content:flex-end; width:100%;">
                <button (click)="deleteStep.emit(stepNodeId!)" class="btn btn-danger btn-sm d-flex align-items-center rounded-2 gap-2" style="background-color:#ff5e5e;font-size:14px; font-weight:500; border:none; padding:6px 18px 6px 12px; min-width:0;" aria-label="Delete Step">
                  <i class="fa-solid fa-trash" style="font-size:1em;"></i> Delete
                </button>
              </div>
            }
          </div>
        </div>
        <!-- Log/Empty State Card -->
        <div class="nk-card nk-card-bordered bg-white rounded-3 shadow-sm p-3 d-flex align-items-center justify-content-center min-h-220 text-muted" style="min-height:220px;">
          <div class="w-100 text-center">
            <i class="fa-solid fa-desktop fa-2x mb-2 opacity-50" style="color:#b8c2cc;"></i>
            <div>Live logs and workflow activity<br>will appear here in the future.</div>
          </div>
        </div>
        <!-- Step Details Card -->
        @if (stepNode) {
          <div class="nk-card nk-card-bordered bg-white rounded-3 shadow-sm mb-0 p-0">
            <div class="card-header bg-light border-bottom px-3 py-2 rounded-top-3">
              <span class="fw-semibold text-xs text-muted">Additional Step Details</span>
            </div>
            <div class="card-body px-3 pt-3 pb-2">
              @if (getSchemaFields(stepNode.step_master?.input_schema).length > 0) {
                <div class="fw-medium text-xs text-primary mb-1">Input Schema</div>
                <form [formGroup]="inputForm" (ngSubmit)="onSubmitInputForm()" autocomplete="off">
                  @for (field of getSchemaFields(stepNode.step_master?.input_schema); track field.name) {
                    <div class="mb-2">
                      <label [for]="'input-' + field.name" class="text-xs fw-medium mb-1 text-muted">{{ field.name }}</label>
                      <input
                        [id]="'input-' + field.name"
                        [type]="field.type === 'number' ? 'number' : 'text'"
                        [formControlName]="field.name"
                        class="form-control form-control-sm rounded-pill"
                        style="width: 100%;"
                      />
                    </div>
                  }
                </form>
              }
              @if (getSchemaFields(stepNode.step_master?.output_schema).length > 0) {
                <div class="fw-medium text-xs text-primary mt-2 mb-1">Output Schema</div>
                @for (field of getSchemaFields(stepNode.step_master?.output_schema); track field.name) {
                  <div class="d-flex align-items-center mb-1">
                    <span class="text-xs text-muted min-w-110">{{ field.name }}</span>
                    <span class="badge bg-primary bg-opacity-10 text-primary ms-2 px-2 py-1 rounded-pill">{{ field.type }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>
      <!-- Button group: always at the bottom, sticky for accessibility -->
      <div class="d-flex gap-3 justify-content-center p-3 border-top bg-light sticky-bottom z-2">
        <button class="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-2 sidebar-btn" aria-label="Start Workflow" tabindex="0" style="background-color:#7269ef; color:#fff; font-size:14px; font-weight:500; border:none;">
          <i class="fa-solid fa-play"></i> Start
        </button>
        @if (!isStopped) {
          <button class="btn btn-danger btn-sm px-3 rounded-2 d-flex align-items-center gap-2 sidebar-btn" (click)="isStopped = true" aria-label="Stop Workflow" tabindex="0" style="background-color:#ff5e5e; color:#fff; font-size:14px; font-weight:500; border:none;">
            <i class="fa-solid fa-stop"></i> Stop
          </button>
        } @else {
          <button class="btn btn-warning btn-sm px-3 rounded-2 d-flex align-items-center gap-2 sidebar-btn" (click)="isStopped = false" aria-label="Continue Workflow" tabindex="0" style="background-color:#ffc107; color:#212529; font-size:14px; font-weight:500; border:none;">
            <i class="fa-solid fa-play"></i> Continue
          </button>
        }
        <button class="btn btn-secondary btn-sm px-3 rounded-2 d-flex align-items-center gap-2 sidebar-btn" aria-label="Reset Workflow" tabindex="0" style="background-color:#eaeef4; color:#495057; font-size:14px; font-weight:500; border:none;">
          <i class="fa-solid fa-rotate-right"></i> Reset
        </button>
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
