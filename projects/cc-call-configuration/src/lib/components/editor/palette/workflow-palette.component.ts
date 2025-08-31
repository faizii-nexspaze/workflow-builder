import { ChangeDetectionStrategy, Component, OnInit, OnDestroy } from '@angular/core';
import { StepService, Step } from '@step-shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'workflow-palette',
  templateUrl: './workflow-palette.component.html',
  styleUrls: ['./workflow-palette.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowPaletteComponent implements OnInit, OnDestroy {
  steps: Step[] = [];
  private sub: Subscription = new Subscription();

  onDragStart(event: DragEvent, step: Step) {
    event.dataTransfer?.setData('application/json', JSON.stringify(step));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  constructor(private stepService: StepService) {}

  ngOnInit() {
    this.sub = this.stepService.getSteps().subscribe((steps: Step[]) => {
      this.steps = steps;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
