import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgIf, NgFor } from '@angular/common';
import { StepService, Step } from '@step-shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'workflow-palette',
  templateUrl: './workflow-palette.component.html',
  styleUrls: ['./workflow-palette.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, NgIf, NgFor]
})
export class WorkflowPaletteComponent implements OnInit, OnDestroy {
  steps: Step[] = [];
  expandedCategories: { [category: string]: boolean } = {};
  private sub: Subscription = new Subscription();

  // Returns unique categories from steps
  get categories(): string[] {
    const cats = this.steps.map((s: Step) => s.category || 'Uncategorized');
    return Array.from(new Set(cats));
  }

  // Returns steps for a given category
  stepsByCategory(category: string) {
    return this.steps.filter((s: Step) => (s.category || 'Uncategorized') === category);
  }

  onDragStart(event: DragEvent, step: Step) {
    event.dataTransfer?.setData('application/json', JSON.stringify(step));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  constructor(private stepService: StepService, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.stepService.getSteps().subscribe((steps: Step[]) => {
      console.log('[WorkflowPaletteComponent] Received steps:', steps);
      this.steps = steps;
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
