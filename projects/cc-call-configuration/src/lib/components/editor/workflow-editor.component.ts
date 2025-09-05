// ...imports remain unchanged...
import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Injector, OnDestroy, OnInit,
  ViewChild,
} from '@angular/core';
import {
  EFConnectableSide, EFConnectionBehavior,
  EFConnectionType,
  EFMarkerType,
  FCanvasComponent,
  FCreateConnectionEvent, FCreateNodeEvent,
  FFlowComponent,
  FFlowModule,
  FReassignConnectionEvent, FZoomDirective,
} from '@foblex/flow';
import { IPoint, Point } from '@foblex/2d';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { WorkflowNodeComponent } from './node/workflow-node.component';
import { WorkflowActionPanelComponent } from './action-panel/workflow-action-panel.component';
import { WorkflowPaletteComponent } from './palette/workflow-palette.component';
import { distinctUntilChanged, filter, map, merge, Observable, startWith, Subject, Subscription, take } from 'rxjs';
import {
  BulkRemoveHandler, BulkRemoveRequest, ChangeNodeHandler, ChangeNodeRequest,
  CreateConnectionHandler, CreateConnectionRequest,
  DetailsFlowHandler,
  DetailsFlowRequest,
  IFlowViewModel,
  INodeViewModel, ReassignConnectionHandler, ReassignConnectionRequest,
} from '../../domain';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { ChangeNodePositionAction, CreateNodeAction, INodeValueModel } from '@domain';
import { EFlowActionPanelEvent } from './action-panel/e-flow-action-panel-event';
import { A, BACKSPACE, DASH, DELETE, NUMPAD_MINUS, NUMPAD_PLUS } from '@angular/cdk/keycodes';
import { StepService, Step } from '@step-shared';
import { WorkflowService } from '../../../../../shared/src/lib/workflow.service';
import { PlatformService, EOperationSystem } from '@foblex/platform';
import { ENodeType } from '@domain';

@Component({
  selector: 'workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: [ './workflow-editor.component.scss' ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FFlowModule,
    WorkflowNodeComponent,
    WorkflowActionPanelComponent,
    WorkflowPaletteComponent,
    FormsModule
  ],
  host: {
    '(keydown)': 'onKeyDown($event)',
    'tabindex': '-1'
  }

})
export class WorkflowEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  // ...existing code...


  // Place drag-and-drop methods after the existing constructor
  // Handle drag-over to allow drop
  public onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  // Required by AfterViewInit
  public ngAfterViewInit(): void {
    this.onLoaded();
  }

  // Create node in the flow (used by onDrop and fCreateNode event)
  public onCreateNode(event: FCreateNodeEvent): void {
    const type = event.data.type;
    const description = event.data.step_description || event.data.description || '';
    this.store.dispatch(
      new CreateNodeAction(this.viewModel!.key, type, event.data.position, description)
    ).pipe(take(1)).subscribe(() => {
      this.hasChanges$.next();
    });
  }

  // Handle drop event to create node from step
  public async onDrop(event: DragEvent) {
    event.preventDefault();
    const data = event.dataTransfer?.getData('application/json');
    if (!data) return;
    let step: Step;
    try {
      step = JSON.parse(data);
    } catch {
      return;
    }

    // Get workflowId from viewModel, or fallback to WorkflowService if needed
    let workflowId: string | undefined = this.viewModel?.key;
    if (!workflowId) {
      try {
        if (this.injector && this.injector.get) {
          const workflowService = this.injector.get<any>('WorkflowService', null);
          if (workflowService && workflowService.getCurrentWorkflowId) {
            workflowId = workflowService.getCurrentWorkflowId();
          }
        }
      } catch {}
    }
    if (!workflowId) {
      console.error('[WorkflowEditorComponent] Unable to determine workflowId for step-node creation.');
      return;
    }

    // Prepare payload for API
    const payload = {
      step_master_id: step.step_id,
      step_node_label: step.step_name || '',
      position_x: 100, // You can enhance to use actual drop position
      position_y: 100,
      step_node_config: {} // statically set for now
    };

    // Call backend API to create step-node
    try {
      const result = await this.stepService.addStepToWorkflow(workflowId, payload).toPromise();
      // Now create the node in the UI (as before)
      let nodeType: any = step.step_type;
      if (!Object.values(ENodeType).includes(nodeType)) {
        nodeType = ENodeType.WorkflowBuilderStep;
      }
      const nodeData = {
        ...step,
        key: result?.step_node_id || ('node_' + Date.now()),
        type: nodeType,
        position: { x: payload.position_x, y: payload.position_y },
      };
      this.onCreateNode({ data: nodeData, rect: { x: payload.position_x, y: payload.position_y, width: 100, height: 60 } } as any);
    } catch (err) {
      console.error('[WorkflowEditorComponent] Failed to create step-node via API:', err);
    }
  }

  private subscriptions$: Subscription = new Subscription();

  public viewModel: IFlowViewModel | undefined;

  @ViewChild(FFlowComponent, { static: false })
  public fFlowComponent!: FFlowComponent;

  @ViewChild(FCanvasComponent, { static: false })
  public fCanvasComponent!: FCanvasComponent;

  @ViewChild(FZoomDirective, { static: false })
  public fZoomDirective!: FZoomDirective;

  public eMarkerType = EFMarkerType;

  public eConnectableSide = EFConnectableSide;

  public cBehavior: EFConnectionBehavior = EFConnectionBehavior.FIXED;

  public cType: EFConnectionType = EFConnectionType.SEGMENT;

  private hasChanges$: Subject<void> = new Subject<void>();

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
    private workflowService: WorkflowService
  ) {}

  // Fit the canvas to screen (used by ngAfterViewInit)
  public onLoaded(): void {
    this.fCanvasComponent?.fitToScreen(new Point(300, 300), false);
  }


  public flows$ = this.store.select(state => state.flows.flows);
  public loading = true;

  public ngOnInit(): void {
    // Wait for flows to be loaded before initializing the editor
    this.subscriptions$.add(
      this.flows$.subscribe(flows => {
        const key = this.activatedRoute.snapshot.params['key'];
        if (flows && flows.length > 0 && flows.some((f: any) => f.key === key)) {
          this.loading = false;
          // Only subscribe once to reload events
          if (!this._reloadEventsSub) {
            this._reloadEventsSub = this.subscribeReloadEvents();
            this.subscriptions$.add(this._reloadEventsSub);
          }
        }
      })
    );
  }

  private _reloadEventsSub: Subscription | null = null;

  private subscribeReloadEvents(): Subscription {
    return merge(this.hasChanges$, this.routeKeyChange$).subscribe((res) => {
      const key = this.activatedRoute.snapshot.params['key'];
      // Fetch workflow details from backend
      this.workflowService.getWorkflowById(key).subscribe({
        next: (wf) => {
          // Build a map of valid node keys for fast lookup
          const rawNodes = wf.nodes || [];
          const validNodeKeys = new Set<string>(rawNodes.map((n: any) => n.step_node_id));

          // Normalize nodes: ensure all required properties for Foblex Flow
          const nodes = rawNodes.map((n: any) => {
            // Always use the type expected by your node component
            const nodeType = 'WorkflowBuilderStep';
            // Defensive: ensure outputs/inputs arrays exist
            const outputs = Array.isArray(n.outputs) ? n.outputs : [];
            const inputs = Array.isArray(n.inputs) ? n.inputs : [];
            // Always provide step_name and description
            const step_name = n.step_master?.step_name || n.step_name || 'Unnamed Step';
            const description = n.step_master?.description || n.description || '';
            // Provide all required properties for INodeViewModel
            return {
              key: n.step_node_id,
              name: step_name, // for INodeViewModel compatibility
              label: step_name, // for template compatibility
              color: n.color || '#2196f3', // fallback color
              icon: n.icon || 'category', // fallback icon
              description,
              isExpanded: n.isExpanded ?? false,
              isExpandable: n.isExpandable ?? false,
              outputs,
              input: n.input,
              position: { x: n.position_x, y: n.position_y },
              type: nodeType,
              value: n.value ?? null,
              // keep all other properties for reference
              ...n
            };
          });

          // Map and filter connections: only keep those where both from/to exist
          const rawConnections = wf.edges || [];
          const connections = rawConnections
            .filter((e: any) => validNodeKeys.has(e.from) && validNodeKeys.has(e.to))
            .map((e: any) => ({
              key: e.edge_id || (e.from + '-' + e.to),
              from: e.from,
              to: e.to,
              ...e
            }));

          this.viewModel = {
            key: wf.workflow_id,
            nodes,
            connections
          } as any;
          // Only reset if fFlowComponent exists and nodes are present
          if (res && this.fFlowComponent && nodes.length > 0) {
            this.fFlowComponent.reset();
          }
          this.changeDetectorRef.detectChanges();
        },
        error: (err) => {
          console.error('[WorkflowEditorComponent] Failed to load workflow from API:', err);
          this.viewModel = undefined;
          this.changeDetectorRef.detectChanges();
        }
      });
    });
  }

  public onNodePositionChanged(point: IPoint, node: INodeViewModel): void {
    // Only update backend, then reload workflow to update state
    this.stepService.updateStepNode(node.key, { position_x: point.x, position_y: point.y })
      .subscribe({
        next: () => {
          this.hasChanges$.next(); // reload workflow after backend update
        },
        error: (err) => {
          console.error('[WorkflowEditorComponent] Failed to update step node position:', err);
        }
      });
  }

  public onCreateConnection(event: FCreateConnectionEvent): void {
    if (!event.fInputId) {
      return;
    }
    this.viewModel = this.injector.get(CreateConnectionHandler).handle(
      new CreateConnectionRequest(this.viewModel!, event.fOutputId, event.fInputId)
    );
    this.changeDetectorRef.detectChanges();
  }

  public onReassignConnection(event: FReassignConnectionEvent): void {
    if(!event.newTargetId) {
      return;
    }
    this.viewModel = this.injector.get(ReassignConnectionHandler).handle(
      new ReassignConnectionRequest(this.viewModel!, event.oldSourceId, event.oldTargetId, event.newTargetId)
    );
    this.changeDetectorRef.detectChanges();
  }

  public onRemoveConnection(outputKey: string): void {
    const connection = this.viewModel!.connections.find((x) => x.from === outputKey);

    this.viewModel = this.injector.get(BulkRemoveHandler).handle(
      new BulkRemoveRequest(this.viewModel!, [], [ connection!.key ])
    );
    this.changeDetectorRef.detectChanges();
  }

  public onRemoveItems(): void {
    const selection = this.fFlowComponent.getSelection();
    this.viewModel = this.injector.get(BulkRemoveHandler).handle(
      new BulkRemoveRequest(this.viewModel!, selection.fNodeIds, selection.fConnectionIds)
    );
    this.changeDetectorRef.detectChanges();
  }

  public onValueChanged(node: INodeViewModel, value: INodeValueModel): void {
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
