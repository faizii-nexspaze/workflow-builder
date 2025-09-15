import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { WorkflowService } from '../../../../../shared/src/lib/workflow.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'workflow-create',
  templateUrl: './workflow-create.component.html',
  styleUrls: ['./workflow-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule]
})
export class WorkflowCreateComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<any>();
  @Input() show = false;

  workflow: any = {
    name: '',
    description: '',
    version: ''
  };

  loading = false;

  constructor(
    private workflowService: WorkflowService,
    private snackBar: MatSnackBar
  ) {}

  close() {
    this.closed.emit();
  }

  submit(form: NgForm) {
    if (form.valid) {
      this.loading = true;
      const payload = {
        workflow_name: this.workflow.name,
        workflow_description: this.workflow.description,
        version: this.workflow.version,
        is_active: true
      };
      this.workflowService.createWorkflow(payload).subscribe({
        next: (response: any) => {
          this.created.emit(response); // Parent will handle reload and toast
          this.close();
          setTimeout(() => {
            this.snackBar.open('Workflow created successfully!', 'Close', { duration: 3000 });
          }, 100); // Show toast after modal closes
          this.loading = false;
        },
        error: (err: any) => {
          this.close();
          setTimeout(() => {
            this.snackBar.open('Failed to create workflow', 'Close', { duration: 3000 });
          }, 100);
          this.loading = false;
        }
      });
    }
  }
}
