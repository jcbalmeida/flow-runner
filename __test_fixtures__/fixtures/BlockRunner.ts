import IBlock from '../../src/flow-spec/IBlock'
import IBlockRunner from '../../src/domain/runners/IBlockRunner'

export const createStaticFirstExitBlockRunnerFor = (block: IBlock) => ({
  block,
  initialize: () => undefined,
  run: () => block.exits[0],
} as IBlockRunner)