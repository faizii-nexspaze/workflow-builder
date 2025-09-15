import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { FieldMappingModalComponent } from './field-mapping-modal.component';
import { StartWorkflowModalComponent } from './start-workflow-modal.component';
import { WorkflowService } from '../../../../../shared/src/lib/workflow.service';
import { StepService } from '../../../../../shared/src/lib/step.service';

@Component({
  selector: 'workflow-sidebar',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FieldMappingModalComponent, StartWorkflowModalComponent, CommonModule],
  template: `
    <div class="nk-sidebar-card bg-light border-start border-2 border-primary d-flex flex-column h-100" style="position:relative;">
      <!-- Excel-like resize/drag handle icon -->
  <div style="position:absolute; left:-12px; top:8px; z-index:1100; background:#fff; border-radius:50%; box-shadow:0 1px 4px rgba(60,72,100,0.10); width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:1.5px solid #e5e9f2;">
        <i class="fa fa-grip-horizontal" style="font-size:18px; color:#b8b8b8;"></i>
      </div>
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
                <div class="fw-medium text-xs text-primary mb-1">Dynamic Field Mapping</div>
                <form [formGroup]="inputForm" autocomplete="off">
                  <div style="overflow-x:auto; max-width:100%;">
                    <table class="table table-hover table-bordered mb-2" style="min-width:480px; font-size:13px; background:#fff; border-radius:8px;">
                      <thead class="thead-light">
                        <tr style="background:#f5f6fa;">
                          <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:40%; color:#6c757d; letter-spacing:0.05em;">Field Name</th>
                          <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:30%; color:#6c757d; letter-spacing:0.05em;">Action</th>
                          <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:30%; color:#6c757d; letter-spacing:0.05em;">Value / Mapping</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (field of getSchemaFields(stepNode.step_master?.input_schema); track field.name) {
                          <tr>
                            <td class="align-middle py-2 px-3" style="font-weight:500; color:#7269ef;">{{ field.name }}</td>
                            <td class="align-middle py-2 px-3">
                              <div class="custom-dropdown" [class.open]="openDropdown === field.name" (clickOutside)="openDropdown = null" [class.dropup]="isLastRow(field.name)">
                                <button type="button" class="dropdown-toggle-btn" (click)="$event.stopPropagation(); openDropdown = openDropdown === field.name ? null : field.name">
                                  <span>{{ fieldModes[field.name] === 'direct' ? 'Direct Value' : 'Map Field' }}</span>
                                  <i class="fa fa-chevron-down ms-1" style="font-size:12px;" *ngIf="!isLastRow(field.name)"></i>
                                  <i class="fa fa-chevron-up ms-1" style="font-size:12px;" *ngIf="isLastRow(field.name)"></i>
                                </button>
                                <ul class="dropdown-menu-list" *ngIf="openDropdown === field.name" [ngClass]="{'dropup-menu': isLastRow(field.name)}">
                                  <li (click)="$event.stopPropagation(); fieldModes[field.name] = 'direct'; openDropdown = null;" [class.selected]="fieldModes[field.name] === 'direct'">Direct Value</li>
                                  <li (click)="$event.stopPropagation(); fieldModes[field.name] = 'map'; openDropdown = null;" [class.selected]="fieldModes[field.name] === 'map'">Map Field</li>
                                </ul>
                              </div>
                              <style>
                                .custom-dropdown {
                                  position: relative;
                                  display: inline-block;
                                  width: 150px;
                                  min-width: 150px;
                                  z-index: 2000;
                                }
                                .dropdown-toggle-btn {
                                  width: 100%;
                                  background: #fff;
                                  border: 1.5px solid #e5e9f2;
                                  border-radius: 10px;
                                  box-shadow: 0 2px 8px 0 rgba(60,72,100,0.04);
                                  font-size: 14px;
                                  font-weight: 500;
                                  color: #364a63;
                                  padding: 10px 18px;
                                  height: 44px;
                                  text-align: left;
                                  display: flex;
                                  align-items: center;
                                  justify-content: space-between;
                                  cursor: pointer;
                                  transition: border-color 0.2s;
                                  white-space: nowrap;
                                  overflow: hidden;
                                }
                                .dropdown-toggle-btn:focus {
                                  border-color: #7269ef;
                                  outline: none;
                                }
                                .dropdown-menu-list {
                                  position: absolute;
                                  left: 0;
                                  top: 110%;
                                  min-width: 100%;
                                  background: #fff;
                                  border: 1.5px solid #e5e9f2;
                                  border-radius: 10px;
                                  box-shadow: 0 8px 24px 0 rgba(60,72,100,0.10);
                                  z-index: 3000;
                                  margin: 0;
                                  padding: 4px 0;
                                  list-style: none;
                                  max-height: 180px;
                                  overflow-y: auto;
                                }
                                .custom-dropdown.dropup .dropdown-menu-list,
                                .dropdown-menu-list.dropup-menu {
                                  top: auto;
                                  bottom: 110%;
                                  box-shadow: 0 -8px 24px 0 rgba(60,72,100,0.10);
                                }
                                .dropdown-menu-list li {
                                  padding: 12px 20px;
                                  font-size: 15px;
                                  color: #364a63;
                                  cursor: pointer;
                                  border-radius: 8px;
                                  transition: background 0.15s, color 0.15s;
                                }
                                .dropdown-menu-list li:hover, .dropdown-menu-list li.selected {
                                  background: #f5f6fa;
                                  color: #7269ef;
                                }
                              </style>
                            </td>
                            <td class="align-middle py-2 px-3">
                              @if (inputForm && fieldModes[field.name] === 'direct') {
                                <input
                                  [type]="field.type === 'number' ? 'number' : 'text'"
                                  class="form-control form-control-sm"
                                  style="min-width:140px; border-radius:6px;"
                                  [formControlName]="field.name"
                                  placeholder="Enter value"
                                  (blur)="autosave(field.name, $event)"
                                  (keydown.enter)="autosave(field.name, $event)"
                                />
                              } @else {
                                <button class="btn btn-outline-primary btn-xs px-3 py-1 rounded-pill map-field-btn" type="button" (click)="openFieldMappingModal(field.name)">
                                  <i class="fa fa-link me-1" style="font-size:13px;"></i> Map Field
                                  <span *ngIf="mappedFields[field.name]" class="ms-2 text-success mapped-value">({{ mappedFields[field.name] }})</span>
                                </button>
                                <style>
                                  .map-field-btn {
                                    min-width: 180px !important;
                                    max-width: 100%;
                                    white-space: nowrap;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    display: inline-flex;
                                    align-items: center;
                                    justify-content: flex-start;
                                    font-size: 14px;
                                    font-weight: 500;
                                    padding-left: 16px;
                                    padding-right: 16px;
                                  }
                                  .map-field-btn .mapped-value {
                                    display: inline-block;
                                    max-width: 90px;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    vertical-align: middle;
                                    white-space: nowrap;
                                  }
                                </style>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
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
  <button class="btn btn-primary btn-sm px-3 rounded-2 d-flex align-items-center gap-2 sidebar-btn" aria-label="Start Workflow" tabindex="0" style="background-color:#7269ef; color:#fff; font-size:14px; font-weight:500; border:none;" (click)="onStartWorkflow()" [disabled]="false">
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
  <!-- Field Mapping Modal -->
  <field-mapping-modal
    *ngIf="showModal"
    [schemas]="masterSchemas"
    (fieldSelected)="onFieldMapped($event)"
    (closed)="closeFieldMappingModal()"
  ></field-mapping-modal>
  <!-- Start Workflow Modal -->
  <start-workflow-modal
    *ngIf="showStartModal"
    [response]="startModalResponse"
    (closed)="closeStartWorkflowModal()"
  ></start-workflow-modal>
  `
})
export class WorkflowSidebarComponent implements OnInit, OnChanges {
  // Helper to check if a field is the last visible row in the table
  isLastRow(fieldName: string): boolean {
    if (!this.stepNode || !this.stepNode.step_master) return false;
    const fields = this.getSchemaFields(this.stepNode.step_master.input_schema);
    if (!fields || fields.length === 0) return false;
    return fields[fields.length - 1]?.name === fieldName;
  }
  @Input() workflow: any = null;
  ngOnInit(): void {
    // Initialization logic can be added here if needed
  }
  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private stepService: StepService,
    private cd: ChangeDetectorRef
  ) {}
  // Field mapping and modal state
  mappingFieldName: string | null = null;
  mappedFields: { [key: string]: string } = {};
  fieldModes: { [key: string]: 'direct' | 'map' } = {};
  showFieldMappingModal: boolean = false;
  masterSchemas: any = null;

  // Autosave method: print field name and value/mapped field
  autosave(fieldName: string, event?: any) {
    const mode = this.fieldModes[fieldName];
    let value = '';
    let obj;
    if (mode === 'direct') {
      if (event && event.target) {
        value = event.target.value;
        this.inputForm.get(fieldName)?.setValue(value, { emitEvent: false });
      } else {
        value = this.inputForm.get(fieldName)?.value;
      }
      obj = { input_schema: [ { [fieldName]: { type: 'direct', value: value } } ] };
      console.log(JSON.stringify(obj));
    } else if (mode === 'map') {
      value = this.mappedFields[fieldName];
      let table = '';
      let field = '';
      if (value && value.includes('.')) {
        const parts = value.split('.');
        table = parts[0] || '';
        field = parts[1] || '';
      } else {
        field = value || '';
      }
      obj = { input_schema: [ { [fieldName]: { type: 'mapping', table, field } } ] };
      console.log(JSON.stringify(obj));
    }
    // Call updateStepTemplateSchema API to store the value
    const stepTemplateId = this.stepNode?.step_master?.step_templates?.[0]?.step_template_id;
    if (stepTemplateId && obj) {
      this.stepService.updateStepTemplateSchema(stepTemplateId, { input_schema: obj.input_schema })
        .subscribe({
          next: (res) => { console.log('[AutoSave] input_schema updated', res); },
          error: (err) => { console.error('[AutoSave] Failed to update input_schema', err); }
        });
    }
  }

  openFieldMappingModal(fieldName: string) {
    this.mappingFieldName = fieldName;
    // Always fetch schemas fresh when opening modal
    this.masterSchemas = null;
    this.workflowService.getMasterSchemas().subscribe({
      next: (schemas) => {
        this.masterSchemas = schemas;
        this.showFieldMappingModal = true;
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('[FieldMapping] Failed to fetch master schemas', err);
        this.showFieldMappingModal = true; // Still show modal, but will show loading/error
        this.cd.markForCheck();
      }
    });
  }
  // For custom dropdown open state
  openDropdown: string | null = null;
  @Input() workflowName: string = '';
  @Input() workflowDescription: string = '';
  @Input() stepNodeId: string | null = null;
  @Input() stepNode: any = null;
  @Output() deleteStep = new EventEmitter<string>();
  isStopped = false;
  inputForm: FormGroup = this.fb.group({});
  // Modal and mapping state

  showStartModal: boolean = false;
  startModalResponse: any = null;

  onStartWorkflow() {
    let stepTemplateIds: string[] = [];
    // If a step is selected, use its step_templates
    if (this.stepNode && this.stepNode.step_master && this.stepNode.step_master.step_templates) {
      console.log('[StartWorkflow] Button clicked: stepNode mode');
      for (const tmpl of this.stepNode.step_master.step_templates) {
        if (tmpl.step_template_id) {
          stepTemplateIds.push(tmpl.step_template_id);
        }
      }
    }
    // If no step is selected, collect from the workflow (if available)
    else if (this.workflow && Array.isArray(this.workflow.nodes)) {
      console.log('[StartWorkflow] Button clicked: workflow mode');
      for (const node of this.workflow.nodes) {
        if (node.step_master && Array.isArray(node.step_master.step_templates)) {
          for (const tmpl of node.step_master.step_templates) {
            if (tmpl.step_template_id) {
              stepTemplateIds.push(tmpl.step_template_id);
            }
          }
        }
      }
    } else {
      console.log('[StartWorkflow] Button clicked: no stepNode or workflow context');
    }
    if (stepTemplateIds.length > 0) {
      const payload = { step_template_ids: stepTemplateIds };
      console.log('[StartWorkflow] Sending payload:', payload);
      this.stepService.getStepDetailsByStepTemplateId(payload).subscribe({
        next: (res) => {
          console.log('[StartWorkflow] API response:', res);
          this.startModalResponse = res;
          this.showStartModal = true;
          this.cd.markForCheck();
        },
        error: (err) => {
          console.error('[StartWorkflow] API error:', err);
        }
      });
    } else {
      console.warn('[StartWorkflow] No step_template_ids found.');
    }
  }

  closeStartWorkflowModal() {
    this.showStartModal = false;
    this.startModalResponse = null;
  }


  onFieldMapped(event: { table: string, field: string }) {
    if (this.mappingFieldName) {
      this.mappedFields[this.mappingFieldName] = `${event.table}.${event.field}`;
      // Call autosave for mapped field
      this.autosave(this.mappingFieldName);
    }
    this.closeFieldMappingModal();
  }

  closeFieldMappingModal() {
    this.showFieldMappingModal = false;
    this.mappingFieldName = null;
    this.masterSchemas = null;
  }
  // Modal rendering
  get showModal() {
    return this.showFieldMappingModal;
  }



  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stepNode'] && this.stepNode && this.stepNode.step_master) {
      this.buildInputForm();
    }
  }

  buildInputForm() {
    const fields = this.getSchemaFields(this.stepNode.step_master?.input_schema);
    const group: { [key: string]: FormControl } = {};
    // Try to get values from step_templates[0].input_schema if available
    let templateInputSchema: any[] = [];
    const stepTemplates = this.stepNode?.step_master?.step_templates;
    if (Array.isArray(stepTemplates) && stepTemplates.length > 0 && Array.isArray(stepTemplates[0].input_schema)) {
      templateInputSchema = stepTemplates[0].input_schema;
    }
    // Build a lookup for field values from template input_schema
    const templateFieldValues: Record<string, any> = {};
    for (const entry of templateInputSchema) {
      const key = Object.keys(entry)[0];
      templateFieldValues[key] = entry[key];
    }
    for (const field of fields) {
      let value = '';
      let mode: 'direct' | 'map' = 'direct';
      if (templateFieldValues[field.name]) {
        const fieldObj = templateFieldValues[field.name];
        if (fieldObj.type === 'direct') {
          value = fieldObj.value || '';
          mode = 'direct';
        } else if (fieldObj.type === 'mapping') {
          value = (fieldObj.table ? fieldObj.table + '.' : '') + (fieldObj.field || '');
          mode = 'map';
        }
      }
      group[field.name] = new FormControl(value);
      this.fieldModes[field.name] = mode;
      this.mappedFields[field.name] = mode === 'map' ? value : '';
    }
    this.inputForm = this.fb.group(group);
    // No valueChanges subscription for autosave! Only call autosave on blur/Enter from template.
  }

  onSubmitInputForm() {
    if (this.inputForm && this.inputForm.valid) {
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
