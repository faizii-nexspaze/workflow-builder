// ...existing code...
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {
  filter,
  Observable, of, startWith,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import {CreateFlowAction, RemoveFlowAction, FlowState} from '@domain';
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
    IconButtonComponent,
    MatIcon,
  NgIf,
  NgFor
  ]
})

export class WorkflowListComponent implements OnInit, OnDestroy {

  public collapsed = false;
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
    private router: Router
  ) {
  }

  public ngOnInit(): void {
    this.getData();

    this.subscriptions$.add(this.subscribeOnRouteChanges());
  }

  private getData(): void {
    const entities = this.store.selectSnapshot(FlowState.summaryList).reverse();
    if (!entities || !entities.length) {
      this.onCreate();
    } else {
      this.entities = entities;
      this.filterEntities();
    }
  }

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
    const key = generateGuid();
    this.store.dispatch(new CreateFlowAction(key, entityName + Date.now())).pipe(take(1)).subscribe(() => {
      this.navigateToEntity(key);
      this.getData();
    });
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
      this.getData();
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
