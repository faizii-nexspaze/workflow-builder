import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'start-workflow-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop fade show" style="z-index:1050;"></div>
    <div class="modal d-block" tabindex="-1" style="z-index:1060; font-family: 'Inter', 'Nunito', Arial, sans-serif;">
      <div class="modal-dialog" style="max-width: 720px; min-width: 600px;">
        <div class="modal-content dashlite-modal-content" style="font-size: 14px;">
          <div class="modal-header bg-light border-bottom align-items-center px-4" style="border-radius:12px 12px 0 0;">
            <h5 class="modal-title fw-semibold" style="font-size:1.1rem; color:#364a63;"><i class="fa fa-play-circle me-2 text-primary"></i>Start Workflow</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="close()"></button>
          </div>
          <div class="modal-body p-0" style="max-height:70vh; overflow:auto; background:#f5f6fa;">
            <div class="dashlite-step-content px-4 pb-3" style="margin-top: 18px;">
              <ng-container *ngIf="steps && steps.length > 0">
                <div *ngFor="let step of steps; let idx = index" class="dashlite-step-card card mb-4 px-4 py-4" style="border-radius:18px; background:#fff; min-height: 180px;">
                  <div class="mb-3">
                    <div class="fw-bold text-lg mb-1" style="font-size:1.08rem; color:#364a63;">
                      <i class="fa fa-cube me-2 text-info"></i>{{ step.step_name }}
                    </div>
                    <div class="text-muted mb-2" style="font-size:13px;">{{ step.step_description }}</div>
                  </div>
                  <ng-container *ngIf="step.step_template && step.step_template.input_schema">
                    <div class="row gx-3 gy-2 mb-1">
                      <ng-container *ngFor="let field of getStepTemplateFields(step.step_template); let i = index">
                        <div class="col-6 d-flex align-items-center px-2 py-1">
                          <label class="form-label fw-semibold text-sm mb-0 me-2 flex-shrink-0" style="color:#7269ef; min-width:90px; font-size:13px;">{{ field.label }}</label>
                          <ng-container [ngSwitch]="field.type">
                            <input *ngSwitchCase="'direct'" type="text" class="form-control dashlite-input bg-light flex-grow-1" [value]="field.value" disabled style="border-radius:7px; font-size:13px; min-width:0; max-width:220px; padding: 4px 10px;">
                            <span *ngSwitchCase="'mapping'" 
                              class="form-control dashlite-input bg-light d-flex align-items-center mapped-value-tooltip"
                              #mappingSpan
                              [attr.title]="field.mapping"
                              style="border-radius:7px; font-size:13px; width:100%; max-width:220px; color:#364a63; padding: 4px 10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; height: 40px; cursor:pointer;">
                              <i class="fa fa-link me-1 text-info"></i>{{ field.mapping.length > 22 ? (field.mapping | slice:0:22) + '...' : field.mapping }}
                            </span>
                          </ng-container>
                        </div>
                      </ng-container>
                    </div>
                  </ng-container>
                </div>
                <!-- Static fields block -->
                <div class="dashlite-step-card dashlite-static-card card mb-0 p-4">
                  <div class="row gx-3 gy-3">
                    <div class="col-6 mb-3" *ngFor="let staticField of staticFields; let idx = index">
                      <label class="form-label fw-semibold text-sm mb-1" style="color:#7269ef; font-size:13px;">{{ staticField.label }}</label>
                      <input type="text" class="form-control dashlite-input" [placeholder]="staticField.label">
                    </div>
                  </div>
                </div>
              </ng-container>
            </div>
            <div class="modal-footer bg-white border-top-0 d-flex justify-content-end align-items-center px-4 py-3" style="border-radius:0 0 12px 12px; font-size:13px;">
              <button type="button" class="btn btn-success me-2 d-flex align-items-center" (click)="execute()" style ="font-size:12px; font-weight:bold;">
                <i class="fa fa-play me-1"></i> Execute
              </button>
              <button type="button" class="btn btn-danger d-flex align-items-center" (click)="close()" style ="font-size:12px; font-weight:bold;">
                <i class="fa fa-times me-1"></i> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .mapped-value-tooltip {
        cursor: pointer;
      }
      .dashlite-step-card { box-shadow: 0 2px 8px 0 rgba(60,72,100,0.04); border-radius: 18px; background: #fff; }
      .dashlite-static-card {
        min-height: 180px;
        padding: 32px 24px 32px 24px;
      }
      .dashlite-input:focus { border-color: #7269ef; box-shadow: 0 0 0 2px #e5e9f2; }
      .dashlite-step-card label { font-size: 13px; }
      .dashlite-step-card input, .dashlite-step-card span.form-control {
        font-size: 13px;
        padding: 10px 16px;
        min-height: 40px;
      }
      .dashlite-step-card .col-6 { display: flex; align-items: center; }
      .dashlite-step-card .form-label { margin-bottom: 0; margin-right: 8px; }
      .dashlite-step-card .form-control { margin-bottom: 0; }
    </style>
  `
})
export class StartWorkflowModalComponent {
  @Input() response: any = null;
  @Output() closed = new EventEmitter<void>();

  steps: any[] = [];
  stepForms: FormGroup[] = [];
  currentStep: number = 0;

  staticFields = [
    { name: 'product_id', label: 'Product ID' },
    { name: 'process_id', label: 'Process ID' },
    { name: 'hardware_id', label: 'Hardware ID' },
    { name: 'material_id', label: 'Material ID' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnChanges() {
    this.initSteps();
  }

  ngOnInit() {
    this.initSteps();
  }

  initSteps() {
    // Parse steps from response
    if (this.response && this.response.steps && Array.isArray(this.response.steps)) {
      this.steps = this.response.steps;
      this.stepForms = this.steps.map(step => this.createStepForm(step));
      this.currentStep = 0;
    } else {
      this.steps = [];
      this.stepForms = [];
      this.currentStep = 0;
    }
  }

  createStepForm(step: any): FormGroup {
    const group: any = {};
    const fields = this.getInputFields(step);
    for (const field of fields) {
      group[field.name] = this.fb.control(field.value || '');
    }
    return this.fb.group(group);
  }

  getInputFields(step: any): any[] {
    // Collect fields from input_schema and output_schema
    let fields: any[] = [];
    // Helper to parse schema
    const parseSchema = (schema: any) => {
      if (!schema) return [];
      let out: any[] = [];
      if (Array.isArray(schema)) {
        for (const item of schema) {
          if (typeof item === 'object' && item !== null) {
            const key = Object.keys(item)[0];
            const val = item[key];
            if (typeof val === 'object' && val !== null && val.type === 'mapping') {
              out.push({ name: key, label: this.toLabel(key), type: 'text', value: '', mapping: val.table + '.' + val.field });
            } else {
              out.push({ name: key, label: this.toLabel(key), type: typeof val, value: val });
            }
          }
        }
      } else if (typeof schema === 'object') {
        for (const key of Object.keys(schema)) {
          const val = schema[key];
          if (typeof val === 'object' && val !== null && val.type === 'mapping') {
            out.push({ name: key, label: this.toLabel(key), type: 'text', value: '', mapping: val.table + '.' + val.field });
          } else {
            out.push({ name: key, label: this.toLabel(key), type: typeof val, value: val });
          }
        }
      }
      return out;
    };
    if (step) {
      fields = fields.concat(parseSchema(step.input_schema));
      fields = fields.concat(parseSchema(step.output_schema));
    }
    // Fallback: if no fields, render static demo fields
    if (fields.length === 0) {
      fields = [
        { name: 'product_id', label: 'Product ID', type: 'text', value: '' },
        { name: 'process_id', label: 'Process ID', type: 'text', value: '' },
        { name: 'hardware_id', label: 'Hardware ID', type: 'text', value: '' },
        { name: 'material_id', label: 'Material ID', type: 'text', value: '' }
      ];
    }
    return fields;
  }

  getStepTemplateFields(stepTemplate: any): any[] {
    // Parse input_schema from step_template
    let fields: any[] = [];
    if (stepTemplate && stepTemplate.input_schema) {
      const schema = stepTemplate.input_schema;
      if (Array.isArray(schema)) {
        for (const item of schema) {
          if (typeof item === 'object' && item !== null) {
            const key = Object.keys(item)[0];
            const val = item[key];
            if (typeof val === 'object' && val !== null && val.type === 'mapping') {
              fields.push({ name: key, label: this.toLabel(key), type: 'mapping', mapping: val.table + '.' + val.field });
            } else if (typeof val === 'object' && val !== null && val.type === 'direct') {
              fields.push({ name: key, label: this.toLabel(key), type: 'direct', value: val.value });
            }
          }
        }
      }
    }
    return fields;
  }

  toLabel(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  prevStep() {
    if (this.currentStep > 0) this.currentStep--;
  }
  nextStep() {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }
  execute() {
    // Placeholder for execution logic
    alert('Workflow execution triggered!');
  }
  close() {
    this.closed.emit();
  }

  isTruncated(el: HTMLElement): boolean {
    return !!el && el.offsetWidth < el.scrollWidth;
  }
}
