import { INodeViewModelWithPorts } from './index';
import { IConnectionViewModel } from './connection';

export interface IFlowViewModel {
  key: string;
  nodes: INodeViewModelWithPorts[];
  connections: IConnectionViewModel[];
  workflow_name?: string;
  workflow_description?: string;
}
