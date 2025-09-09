import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StepService, Step } from '@step-shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'workflow-palette',
  templateUrl: './workflow-palette.component.html',
  styleUrls: ['./workflow-palette.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, NgIf, NgFor, FormsModule]
})
export class WorkflowPaletteComponent implements OnInit, OnDestroy {
  steps: Step[] = [];
  expandedCategories: { [category: string]: boolean } = {};
  private prevExpandedCategories: { [category: string]: boolean } = {};
  searchText: string = '';
  private sub: Subscription = new Subscription();

  // Returns filtered categories based on search text
  get filteredCategories(): string[] {
    const search = this.searchText.trim().toLowerCase();
    const cats = this.steps.map((s: Step) => s.category || 'Uncategorized');
    const uniqueCats = Array.from(new Set(cats));
    if (!search) return uniqueCats;
    // If search matches category name, show those categories
    const catMatches = uniqueCats.filter(cat => cat.toLowerCase().includes(search));
    // If search matches step name, show categories with at least one matching step
    const stepMatches = uniqueCats.filter(cat =>
      this.stepsByCategory(cat).some(step => step.step_name.toLowerCase().includes(search))
    );
    // Union of both
    return Array.from(new Set([...catMatches, ...stepMatches]));
  }

  // Returns filtered steps for a given category
  stepsByCategory(category: string) {
    const search = this.searchText.trim().toLowerCase();
    const steps = this.steps.filter((s: Step) => (s.category || 'Uncategorized') === category);
    if (!search) return steps;
    return steps.filter(step =>
      step.step_name.toLowerCase().includes(search) ||
      (step.category || 'Uncategorized').toLowerCase().includes(search)
    );
  }

  onDragStart(event: DragEvent, step: Step) {
    event.dataTransfer?.setData('application/json', JSON.stringify(step));
    event.dataTransfer!.effectAllowed = 'copy';
  }

  clearSearch() {
    this.searchText = '';
    // Restore previous expanded state
    this.expandedCategories = { ...this.prevExpandedCategories };
  }


  // Watch searchText and auto-expand matching categories only when searching
  private autoExpandCategories() {
    const search = this.searchText.trim();
    if (search) {
      // Save previous state only once when search starts
      if (Object.keys(this.prevExpandedCategories).length === 0) {
        this.prevExpandedCategories = { ...this.expandedCategories };
      }
      for (const cat of this.filteredCategories) {
        this.expandedCategories[cat] = true;
      }
    }
    // Do not override expandedCategories when search is empty; allow user toggling
  }

  constructor(private stepService: StepService, private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.stepService.getSteps().subscribe((steps: Step[]) => {
      this.steps = steps;
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  // Angular lifecycle: watch searchText and auto-expand only when searching
  ngDoCheck() {
    if (this.searchText.trim()) {
      this.autoExpandCategories();
    }
  }
}
