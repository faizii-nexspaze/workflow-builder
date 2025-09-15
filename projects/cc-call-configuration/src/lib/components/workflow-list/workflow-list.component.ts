// ...existing code...
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
import { WorkflowCreateComponent } from '../workflow-create/workflow-create.component';
import {Store} from '@ngxs/store';
import {
  filter,
  Observable, of, startWith,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import {CreateFlowAction, RemoveFlowAction, FlowState} from '@domain';
import { LoadWorkflowsAction } from '@domain';
import {AsyncPipe, NgIf, NgFor} from '@angular/common';
import {NavigationEnd, Router, RouterLink, RouterLinkActive} from '@angular/router';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatIcon} from '@angular/material/icon';
import {IconButtonComponent} from '@shared-components';
import {generateGuid} from '@foblex/utils';

const entityName = 'flow';

@Component({
  selector: 'workflow-list',
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    MatIcon,
    NgIf,
    NgFor,
    WorkflowCreateComponent
  ]
})

export class WorkflowListComponent implements OnInit, OnDestroy {

  public showCreateModal = false;

  public collapsed = true;
  public toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  private subscriptions$: Subscription = new Subscription();

  public searchControl = new FormControl('');

  public entities: {
    key: string;
    name: string;
  }[] = [];


  public get filteredEntities() {
    const search = this.searchControl.value?.toLowerCase() || '';
    return this.entities.filter(entity => entity.name.toLowerCase().includes(search));
  }

  constructor(
    private store: Store,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
  }

  public ngOnInit(): void {
    this.store.dispatch(new LoadWorkflowsAction());
    // Subscribe to state changes so entities update when API data arrives
    this.subscriptions$.add(
      this.store.select(FlowState.summaryList).subscribe(entities => {
        this.entities = [...entities].reverse();
        this.filterEntities();
        this.cdRef.markForCheck();
      })
    );
    this.subscriptions$.add(this.subscribeOnRouteChanges());
  }

  // getData is no longer needed; state subscription handles updates

  private filterEntities(): void {
    this.searchControl.setValue(this.searchControl.value);
  }

  private subscribeOnRouteChanges(): Subscription {
    return this.router.events.pipe(
      startWith(new NavigationEnd(1, '', '')), filter((x) => x instanceof NavigationEnd)
    ).subscribe(() => {
      const isFlowKey = this.router.url.split('/').pop()?.toLowerCase() !== entityName;
      if (!isFlowKey) {
        this.toDefaultFlow();
      } else {
        this.filterEntities();
      }
    });
  }

  private toDefaultFlow(): void {
    if (this.entities.length > 0) {
      this.navigateToEntity(this.entities[0].key);
    }
  }

  public onCreate(): void {
    this.showCreateModal = true;
  }

  public onModalClosed(): void {
    this.showCreateModal = false;
  }

  public onModalCreated(workflow: any): void {
    this.showCreateModal = false;
    // Reload workflows to reflect the new workflow immediately
    this.store.dispatch(new LoadWorkflowsAction());
  }

  public onDelete(entity: {
    key: string;
    name: string;
  }, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.store.dispatch(new RemoveFlowAction(entity.key)).pipe(take(1)).subscribe(() => {
      if (entity.key === this.router.url.split('/').pop()) {
        this.toDefaultFlow();
      }
  // No need to call getData; state subscription will update entities
    });
  }

  private navigateToEntity(key: string): void {
    this.router.navigateByUrl(`/${entityName}/` + key);
  }

  public ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
  }
  // For ngFor trackBy
  public trackByKey(index: number, item: { key: string }) {
    return item.key;
  }
}
