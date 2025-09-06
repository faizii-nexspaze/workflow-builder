import { INodeViewModel } from './node/i-node-view-model';
// Extend INodeViewModel to include output and input for Angular template compatibility
export interface INodeViewModelWithPorts extends INodeViewModel<string> {
	output: string;
	input: string;
}
export * from './bulk-remove/bulk-remove-handler';
export * from './bulk-remove/bulk-remove-request';

export * from './connection';

export * from './details/details-flow-handler';
export * from './details/details-flow-request';

export * from './node';

export * from './to-view-model/map-to-flow-view-model-handler';
export * from './to-view-model/map-to-flow-view-model-request';

export * from './i-flow-view-model';


