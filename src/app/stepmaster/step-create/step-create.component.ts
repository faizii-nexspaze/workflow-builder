import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepService } from '@step-shared';

@Component({
  selector: 'app-step-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-create.component.html',
  styleUrls: ['./step-create.component.scss']
})
export class StepCreateComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();

  step: any = {
    step_name: '',
    step_description: '',
    step_type: '',
    category: '',
    input_schema: {}
  };

  inputSchemaFields: { name: string; type: string }[] = [
    { name: '', type: '' }
  ];

  constructor(private stepService: StepService) {}

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
    const payload = {
      step_name: this.step.step_name,
      step_description: this.step.step_description,
      input_schema: { type: 'object', properties },
      output_schema: this.step.output_schema || {},
      step_type: this.step.step_type,
      category: this.step.category
    };
    this.stepService.addStep(payload).subscribe({
      next: (createdStep) => {
        this.created.emit(createdStep);
        this.close();
      },
      error: (err) => {
        // Optionally handle error (show message, etc.)
        this.close();
      }
    });
  }
}
