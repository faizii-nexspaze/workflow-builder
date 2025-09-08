import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Injector, OnDestroy, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EFConnectableSide, EFConnectionBehavior, EFConnectionType, EFMarkerType, FCanvasComponent, FCreateConnectionEvent, FFlowComponent, FFlowModule, FReassignConnectionEvent, FZoomDirective } from '@foblex/flow';
import { IPoint, Point } from '@foblex/2d';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { WorkflowNodeComponent } from './node/workflow-node.component';
import { WorkflowSidebarComponent } from './workflow-sidebar.component';
import { WorkflowActionPanelComponent } from './action-panel/workflow-action-panel.component';
import { WorkflowPaletteComponent } from './palette/workflow-palette.component';
import { distinctUntilChanged, filter, map, merge, Observable, startWith, Subject, Subscription } from 'rxjs';
import { BulkRemoveHandler, BulkRemoveRequest, ChangeNodeHandler, ChangeNodeRequest, IFlowViewModel, INodeViewModelWithPorts } from '../../domain';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { INodeValueModel } from '@domain';
import { EFlowActionPanelEvent } from './action-panel/e-flow-action-panel-event';
import { A, BACKSPACE, DASH, DELETE, NUMPAD_MINUS, NUMPAD_PLUS } from '@angular/cdk/keycodes';
import { StepService } from '@step-shared';
import { WorkflowService } from '../../../../../shared/src/lib/workflow.service';
import { PlatformService, EOperationSystem } from '@foblex/platform';
import { PreloaderService } from '../../../../../../src/app/preloader.service'; // Adjust path if needed

@Component({
  selector: 'workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FFlowModule,
    FormsModule,
    WorkflowNodeComponent,
    WorkflowSidebarComponent,
    WorkflowPaletteComponent
  ]
})
export class WorkflowEditorComponent implements OnInit, OnDestroy {
  // Handle delete step-node from sidebar
  public onDeleteStep(stepNodeId: string): void {
    if (!stepNodeId) return;
    this.stepService.deleteStepNode(stepNodeId).subscribe({
      next: (response) => {
        // Show response to user (simple alert for now)
        alert(typeof response === 'string' ? response : 'Step node deleted successfully.');
        // After deletion, refresh workflow and reset sidebar
        this.selectedNode = null;
        this.hasChanges$.next();
        this.changeDetectorRef.markForCheck();
      },
      error: (err) => {
        console.error('[WorkflowEditorComponent] Failed to delete step node:', err);
        alert('Failed to delete step node.');
      }
    });
  }
  public selectedNode: INodeViewModelWithPorts | null = null;
  // Called when a node is double-clicked
  public onNodeClick(node: INodeViewModelWithPorts): void {
    this.selectedNode = node;
    this.changeDetectorRef.markForCheck();
  }

  // Called when user clicks outside nodes (canvas area)
  public onCanvasClick(): void {
    this.selectedNode = null;
    this.changeDetectorRef.markForCheck();
  }
  private subscriptions$: Subscription = new Subscription();
  public viewModel: IFlowViewModel | undefined;
  @ViewChild(FFlowComponent, { static: false }) public fFlowComponent!: FFlowComponent;
  @ViewChild(FCanvasComponent, { static: false }) public fCanvasComponent!: FCanvasComponent;
  @ViewChild(FZoomDirective, { static: false }) public fZoomDirective!: FZoomDirective;
  public eMarkerType = EFMarkerType;
  public eConnectableSide = EFConnectableSide;
  public cBehavior: EFConnectionBehavior = EFConnectionBehavior.FIXED;
  public cType: EFConnectionType = EFConnectionType.SEGMENT;
  private hasChanges$: Subject<void> = new Subject<void>();
  private _reloadEventsSub: Subscription | null = null;
  private get routeKeyChange$(): Observable<boolean> {
    return this.router.events.pipe(
      startWith(new NavigationEnd(0, '', '')),
      filter((x) => x instanceof NavigationEnd), map(() => this.activatedRoute.snapshot.params[ 'key' ]), distinctUntilChanged(),
      map(() => true)
    );
  }
  constructor(
    private store: Store,
    private router: Router,
    private injector: Injector,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private fPlatform: PlatformService,
    private stepService: StepService,
    private workflowService: WorkflowService,
    @Inject(PreloaderService) private preloader: PreloaderService
  ) {}
  public flows$ = this.store.select(state => state.flows.flows);
  public loading = true;

  public ngOnInit(): void {
    this.subscriptions$.add(
      this.flows$.subscribe(flows => {
        const key = this.activatedRoute.snapshot.params['key'];
        if (flows && flows.length > 0 && flows.some((f: any) => f.key === key)) {
          this.loading = false;
          if (!this._reloadEventsSub) {
            this._reloadEventsSub = this.subscribeReloadEvents();
            this.subscriptions$.add(this._reloadEventsSub);
          }
        }
      })
    );
    // Always reset sidebar to workflow details when workflow changes
    this.subscriptions$.add(
      this.routeKeyChange$.subscribe(() => {
        this.selectedNode = null;
        this.changeDetectorRef.markForCheck();
      })
    );
  }

  private subscribeReloadEvents(): Subscription {
    return merge(this.hasChanges$, this.routeKeyChange$).subscribe(() => {
      const key = this.activatedRoute.snapshot.params['key'];
      this.preloader.show();
      this.workflowService.getWorkflowById(key).subscribe({
        next: (wf) => {
          const rawNodes = wf.nodes || [];
          const validNodeKeys = new Set<string>(rawNodes.map((n: any) => n.step_node_id));
          const nodes: INodeViewModelWithPorts[] = rawNodes.map((n: any) => {
            const nodeType = 'WorkflowBuilderStep';
            const stepNodeId = n.step_node_id;
            const step_name = n.step_master?.step_name || n.step_name || 'Unnamed Step';
            const description = n.step_master?.step_description || n.step_description || '';
            return {
              key: stepNodeId,
              name: step_name,
              color: n.color || '#2196f3',
              icon: n.icon || 'category',
              description,
              isExpanded: n.isExpanded ?? false,
              isExpandable: n.isExpandable ?? false,
              position: { x: n.position_x, y: n.position_y },
              type: nodeType,
              value: n.value ?? null,
              ...n,
              output: stepNodeId,
              input: stepNodeId
            } as INodeViewModelWithPorts;
          });
          const rawConnections = wf.edges || [];
          const connections = rawConnections
            .filter((e: any) => validNodeKeys.has(e.source_node_id) && validNodeKeys.has(e.target_node_id))
            .map((e: any) => ({
              key: e.step_edge_id || (e.source_node_id + '-' + e.target_node_id),
              from: e.source_node_id,
              to: e.target_node_id,
              ...e
            }));
          this.viewModel = undefined;
          this.changeDetectorRef.detectChanges();
          this.viewModel = {
            key: wf.workflow_id,
            nodes,
            connections,
            workflow_name: wf.workflow_name || wf.name || 'Workflow',
            workflow_description: wf.workflow_description || wf.description || ''
          } as any;
          if (this.fFlowComponent && nodes.length > 0) {
            this.fFlowComponent.reset();
          }
          this.changeDetectorRef.detectChanges();
          this.preloader.hide();
        },
        error: (err) => {
          console.error('[WorkflowEditorComponent] Failed to load workflow from API:', err);
          this.viewModel = undefined;
          this.changeDetectorRef.detectChanges();
          this.preloader.hide();
        }
      });
    });
  }

  // Fit the canvas to screen (used by ngAfterViewInit)
  public onLoaded(): void {
    this.fCanvasComponent?.fitToScreen(new Point(300, 300), false);
  }

  public onNodePositionChanged(point: IPoint, node: INodeViewModelWithPorts): void {
    this.stepService.updateStepNode(node.key, { position_x: point.x, position_y: point.y })
      .subscribe({
        next: () => {
          this.hasChanges$.next();
        },
        error: (err) => {
          console.error('[WorkflowEditorComponent] Failed to update step node position:', err);
        }
      });
  }

  public onCreateConnection(event: FCreateConnectionEvent): void {
    if (!event.fInputId || !event.fOutputId) {
      return;
    }
    const sourceNode = this.viewModel?.nodes.find(node => node.output === event.fOutputId);
    const targetNode = this.viewModel?.nodes.find(node => node.input === event.fInputId);

    if (!sourceNode || !targetNode) {
      console.error('Could not find source or target node for connection');
      return;
    }

    const workflowId = this.viewModel?.key;
    if (!workflowId) return;

    const payload = {
      source_node_id: sourceNode.key,
      target_node_id: targetNode.key,
      step_edge_label: '',
      step_edge_config: {}
    };

    this.stepService.connectStepNodes(workflowId, payload).subscribe({
      next: () => {
        this.hasChanges$.next();
      },
      error: (err) => {
        console.error('[WorkflowEditorComponent] Failed to create connection:', err);
      }
    });
  }

  public onReassignConnection(event: FReassignConnectionEvent): void {
    let newTargetId = event.newTargetId;
    if (!newTargetId && event.dropPoint && this.viewModel && this.viewModel.nodes) {
      const nodeWidth = 100;
      const nodeHeight = 60;
      const { x, y } = event.dropPoint;
      const found = this.viewModel.nodes.find(node => {
        if (!node.position) return false;
        return (
          x >= node.position.x &&
          x <= node.position.x + nodeWidth &&
          y >= node.position.y &&
          y <= node.position.y + nodeHeight
        );
      });
      if (found) {
        newTargetId = found.key;
      } else {
        let minDist = Infinity;
        let closestNode: any = null;
        this.viewModel.nodes.forEach(node => {
          if (!node.position) return;
          const cx = node.position.x + nodeWidth / 2;
          const cy = node.position.y + nodeHeight / 2;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist < minDist) {
            minDist = dist;
            closestNode = node;
          }
        });
        if (closestNode) {
          newTargetId = closestNode.key;
        }
      }
    }
    if (!newTargetId) {
      return;
    }
    const connection = this.viewModel?.connections.find(
      (c) => c.from === event.oldSourceId && c.to === event.oldTargetId
    );
    if (!connection) {
      return;
    }
    const payload = { target_node_id: newTargetId };
    this.stepService.updateStepEdge(connection.key, payload)
      .subscribe({
        next: () => {
          this.hasChanges$.next();
        },
        error: (err) => {
          console.error('[WorkflowEditorComponent] Failed to update step edge:', err);
        }
      });
  }

  /**
   * Handles edge (connection) deletion from workflow-node.
   * Calls API to delete edge by stepedge_id, reloads workflow on success, shows error on failure.
   * @param stepEdgeId The step edge id (connection key) to delete
   */
  public onRemoveConnection(stepEdgeId: string): void {
    if (!stepEdgeId) return;
    this.stepService.deleteStepEdgeNode(stepEdgeId).subscribe({
      next: () => {
        this.hasChanges$.next(); // reload workflow
      },
      error: (err) => {
        console.error('[WorkflowEditorComponent] Failed to delete step edge:', err);
        alert('Failed to delete step edge.');
      }
    });
  }

  public onRemoveItems(): void {
    const selection = this.fFlowComponent.getSelection();
    this.viewModel = this.injector.get(BulkRemoveHandler).handle(
      new BulkRemoveRequest(this.viewModel!, selection.fNodeIds, selection.fConnectionIds)
    );
    this.changeDetectorRef.detectChanges();
  }

  public onValueChanged(node: INodeViewModelWithPorts, value: INodeValueModel): void {
    const selected = this.fFlowComponent.getSelection();
    node.value = value;
    this.viewModel = this.injector.get(ChangeNodeHandler).handle(
      new ChangeNodeRequest(this.viewModel!, node)
    );
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.fFlowComponent.select(selected.fNodeIds, selected.fConnectionIds);
    });
  }

  public onActionPanelEvent(event: EFlowActionPanelEvent): void {
    switch (event) {
      case EFlowActionPanelEvent.DELETE_SELECTED:
        this.onRemoveItems();
        break;
      case EFlowActionPanelEvent.SELECT_ALL:
        this.fFlowComponent.selectAll();
        break;
      case EFlowActionPanelEvent.ZOOM_IN:
        this.fZoomDirective.zoomIn();
        break;
      case EFlowActionPanelEvent.ZOOM_OUT:
        this.fZoomDirective.zoomOut();
        break;
      case EFlowActionPanelEvent.FIT_TO_SCREEN:
        this.fCanvasComponent.fitToScreen();
        break;
      case EFlowActionPanelEvent.ONE_TO_ONE:
        this.fCanvasComponent.resetScaleAndCenter();
        break;
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    switch (event.keyCode) {
      case BACKSPACE:
      case DELETE:
        this.onRemoveItems();
        break;
      case NUMPAD_PLUS:
        if (this.isCommandButton(event)) {
          this.fZoomDirective.zoomIn();
        }
        break;
      case NUMPAD_MINUS:
      case DASH:
        if (this.isCommandButton(event)) {
          this.fZoomDirective.zoomOut();
        }
        break;
      case A:
        if (this.isCommandButton(event)) {
          this.fFlowComponent.selectAll();
        }
        break;
    }
  }

  private isCommandButton(event: { metaKey: boolean, ctrlKey: boolean }): boolean {
    return this.fPlatform.getOS() === EOperationSystem.MAC_OS ? event.metaKey : event.ctrlKey;
  }

  public ngOnDestroy(): void {
    this.subscriptions$.unsubscribe();
    if (this._reloadEventsSub) {
      this._reloadEventsSub.unsubscribe();
      this._reloadEventsSub = null;
    }
  }
}
