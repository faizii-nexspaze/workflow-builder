  import {
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
  } from '@angular/core';
  import { EFConnectableSide, FFlowModule } from '@foblex/flow';
  import { MatIcon } from '@angular/material/icon';
  import { FormBuilderDirective } from '@shared-components';
  import { FormControl, ReactiveFormsModule } from '@angular/forms';
  import { Subscription } from 'rxjs';
  import type { INodeValueModel } from '@domain';
  import type { INodeViewModel } from '../../../domain';

  @Component({
    selector: 'workflow-node',
    templateUrl: './workflow-node.component.html',
    styleUrls: ['./workflow-node.component.scss'],
    standalone: true,
    imports: [
      FFlowModule,
      MatIcon,
      FormBuilderDirective,
      ReactiveFormsModule
    ],
    host: {
      '[style.border-top-color]': 'model.color',
    }
  })
  export class WorkflowNodeComponent implements OnInit, OnChanges, OnDestroy {
    @Input()
    public connections: any[] = [];

    private subscription$: Subscription = Subscription.EMPTY;

    @Output()
    public valueChange: EventEmitter<INodeValueModel> = new EventEmitter<INodeValueModel>();

    @Output()
    public removeConnection: EventEmitter<string> = new EventEmitter<string>();

    @Input({required: true})
    public model!: INodeViewModel & { output?: string };

    public isBodyVisible: boolean = false;

    public eFConnectableSide = EFConnectableSide;

    public outputs: {
      key: string;
      name: string;
    }[] = [];

    public form: FormControl = new FormControl();

    constructor(
      private changeDetectorRef: ChangeDetectorRef
    ) {}

    public ngOnInit(): void {
      // Debug: log the model data passed to this node
      console.log('[WorkflowNodeComponent] model:', this.model);
      console.log('[WorkflowNodeComponent] model.description:', this.model.description);
      // If step_description is present as a property, log it too
      if ((this.model as any).step_description !== undefined) {
        console.log('[WorkflowNodeComponent] model.step_description:', (this.model as any).step_description);
      }
      this.form = new FormControl(this.model?.value);
      this.isBodyVisible = this.model?.isExpanded || false;
      this.subscription$ = this.subscribeToFormChanges();
    }
    // ...restored original working code from user, enabling workflow node logic...
    // Additional logic can be added here if necessary

    private subscribeToFormChanges(): Subscription {
      return this.form.valueChanges.subscribe((value: any) => {
        this.valueChange.emit(value);
        setTimeout(() => {
          this.outputs = (this.model?.outputs || []).slice().reverse();
        });
      });
    }

    public ngOnChanges(): void {
      this.outputs = (this.model?.outputs || []).slice().reverse();
    }

    public onRemoveConnection(key: string): void {
      this.removeConnection.emit(key);
    }

    public onToggleBodyClick(): void {
      this.isBodyVisible = !this.isBodyVisible;
      this.model.isExpanded = this.isBodyVisible;
      this.changeDetectorRef.markForCheck();
    }

    public ngOnDestroy(): void {
      this.subscription$.unsubscribe();
    }

    /**
     * Emits the step edge id (connection id) for the outgoing connection from this node, if any.
     * Used for bottom output port and X icon click.
     */
    public onBottomOutputClick(event?: MouseEvent): void {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      if (!this.connections || !this.model?.key) return;
      // Find the outgoing connection from this node
      const outgoing = this.connections.find((conn: any) => conn.from === this.model.key);
      if (outgoing && outgoing.key) {
        this.removeConnection.emit(outgoing.key);
      }
    }

    get hasOutgoingConnection(): boolean {
      return Array.isArray(this.connections) && !!this.connections.find(conn => conn.from === this.model?.key);
    }
  }
