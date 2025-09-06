import { IFlowViewModel } from '../../index';

export class ReassignConnectionRequest {

  constructor(
    public readonly flow: IFlowViewModel,
    public readonly outputKey: string,
    public readonly oldInputKey: string,
    public readonly newInputKey: string
  ) {
  }
}
