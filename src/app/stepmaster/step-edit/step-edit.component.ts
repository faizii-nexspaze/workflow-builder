import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-step-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-edit.component.html',
  styleUrls: ['./step-edit.component.scss']
})
export class StepEditComponent implements OnChanges {
  @Input() step: any;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<any>();

  inputSchemaFields: { name: string; type: string }[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['step'] && this.step) {
      // Deep clone to avoid mutating parent
      this.step = JSON.parse(JSON.stringify(this.step));
      // Populate inputSchemaFields from input_schema if available
      if (this.step.input_schema && this.step.input_schema.properties) {
        this.inputSchemaFields = Object.entries(this.step.input_schema.properties).map(([name, val]: [string, any]) => ({
          name,
          type: val.type || ''
        }));
      } else {
        this.inputSchemaFields = [{ name: '', type: '' }];
      }
    }
  }

  close() {
    this.closed.emit();
  }

  addField() {
    this.inputSchemaFields.push({ name: '', type: '' });
  }

  removeField(i: number) {
    if (this.inputSchemaFields.length > 1) {
      this.inputSchemaFields.splice(i, 1);
    }
  }

  submit() {
    // Build input_schema as an object with properties
    const properties: any = {};
    for (const field of this.inputSchemaFields) {
      if (field.name && field.type) {
        properties[field.name] = { type: field.type };
      }
    }
    this.step.input_schema = { type: 'object', properties };
    this.updated.emit(this.step);
    this.close();
  }
}
