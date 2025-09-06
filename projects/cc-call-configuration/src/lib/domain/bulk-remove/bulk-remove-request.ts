import { IFlowViewModel } from '../index';

export class BulkRemoveRequest {

  constructor(
    public readonly flow: IFlowViewModel,
    public readonly nodeKeys: string[],
    public readonly connectionKeys: string[]
  ) {
  }
}
