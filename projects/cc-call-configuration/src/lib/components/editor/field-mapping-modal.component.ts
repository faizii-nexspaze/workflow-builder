import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'field-mapping-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop fade show" style="z-index:1050;"></div>
    <div class="modal d-block" tabindex="-1" style="z-index:1060;">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content" style="border-radius:12px;">
          <div class="modal-header bg-light border-bottom">
            <h5 class="modal-title fw-semibold">Map Field</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="close()"></button>
          </div>
          <div class="modal-body p-3" style="max-height:60vh; overflow:auto;">
            <ng-container *ngIf="schemas">
              <div *ngFor="let table of tableNames" class="mb-4">
                <div class="fw-bold text-primary mb-2" style="font-size:15px; text-transform:uppercase; letter-spacing:0.04em;">{{ table }}</div>
                <div style="overflow-x:auto;">
                  <table class="table table-hover table-bordered mb-0" style="min-width:420px; font-size:14px; background:#fff; border-radius:8px;">
                    <thead class="thead-light">
                      <tr style="background:#f5f6fa;">
                        <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:40%; color:#6c757d; letter-spacing:0.05em;">Field</th>
                        <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:30%; color:#6c757d; letter-spacing:0.05em;">Type</th>
                        <th class="text-uppercase text-xs fw-bold py-2 px-3" style="width:30%; color:#6c757d; letter-spacing:0.05em; text-align:center;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let field of getFields(table)">
                        <td class="align-middle py-2 px-3" style="font-weight:500; color:#7269ef;">{{ field.name }}</td>
                        <td class="align-middle py-2 px-3"><span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-pill" style="font-size:12px; font-weight:500;">{{ field.type }}</span></td>
                        <td class="align-middle py-2 px-3 text-center">
                          <button class="btn btn-outline-primary btn-xs px-2 py-1 rounded-pill" style="font-size:13px; font-weight:500; min-width:48px; height:28px; line-height:1.1; border-width:1.5px;" (click)="selectField(table, field.name)">
                            <i class="fa fa-link me-1" style="font-size:13px;"></i> Map
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ng-container>
            <ng-container *ngIf="!schemas">
              <div class="text-center text-muted py-5">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <div>Loading fields...</div>
              </div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FieldMappingModalComponent implements OnChanges {
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schemas']) {
      // Debug log for schemas
      console.log('[FieldMappingModal] Schemas input changed:', this.schemas);
    }
  }
  @Input() schemas: any = null;
  @Output() fieldSelected = new EventEmitter<{ table: string, field: string }>();
  @Output() closed = new EventEmitter<void>();

  get tableNames(): string[] {
    return this.schemas ? Object.keys(this.schemas) : [];
  }

  getFields(table: string) {
    return Object.entries(this.schemas[table] || {}).map(([name, type]) => ({ name, type }));
  }

  selectField(table: string, field: string) {
    this.fieldSelected.emit({ table, field });
  }

  close() {
    this.closed.emit();
  }
}
