import { ReassignConnectionRequest } from './reassign-connection-request';
import { IHandler } from '@foblex/mediator';
import { CreateConnectionAction, INodeModel } from '@domain';
import { Injectable } from '@angular/core';
import { IConnectionViewModel } from '../i-connection-view-model';
import { Store } from '@ngxs/store';
import { IFlowViewModel } from '../../index';

@Injectable({
  providedIn: 'root'
})
export class ReassignConnectionHandler implements IHandler<ReassignConnectionRequest, IFlowViewModel> {

  constructor(
    private store: Store
  ) {
  }

  public handle(request: ReassignConnectionRequest): IFlowViewModel {

    const outputNode = this.getOutputNode(request.flow, request.outputKey);

    const result = JSON.parse(JSON.stringify(request.flow));

    const connection = result.connections.find((x: IConnectionViewModel) => x.from === request.outputKey && x.to === request.oldInputKey);
    if (connection) {
      connection.to = request.newInputKey;
    }

    this.store.dispatch(new CreateConnectionAction(result.key, outputNode.key, request.outputKey, request.newInputKey));

    return result;
  }

  private getOutputNode(flow: IFlowViewModel, outputKey: string): INodeModel {
    // Support both 'outputs' array and 'output' string property
    const result = flow.nodes.find((x: any) => {
      if (Array.isArray(x.outputs)) {
        return x.outputs.some((y: any) => y.key === outputKey);
      }
      // Fallback for nodes with 'output' as string (your current structure)
      return x.output === outputKey;
    });

    if (!result) {
      throw new Error(`Node not found for outputKey: ${outputKey}`);
    }

    return result;
  }
}
