import { IFlowViewModel } from '../../index';
import { INodeViewModel } from '../i-node-view-model';

export class ChangeNodeRequest {

  constructor(
    public readonly flow: IFlowViewModel,
    public readonly node: INodeViewModel
  ) {
  }
}
