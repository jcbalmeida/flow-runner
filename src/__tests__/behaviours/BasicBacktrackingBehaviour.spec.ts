import {first, last} from 'lodash'
import BacktrackingBehaviour from '../../domain/behaviours/BacktrackingBehaviour/BacktrackingBehaviour'
import IContext from '../../flow-spec/IContext'
import IBlockInteraction from '../../flow-spec/IBlockInteraction'
import IFlow from '../../flow-spec/IFlow'
import {IBasePromptConfig, IPromptConfig} from '../../index'
import {NON_INTERACTIVE_BLOCK_TYPES} from '../../domain/FlowRunner'
import IPrompt from '../../domain/prompt/IPrompt'
import IBlock from '../../flow-spec/IBlock'
import BasicBacktrackingBehaviour from '../../domain/behaviours/BacktrackingBehaviour/BasicBacktrackingBehaviour'


describe('BasicBacktrackingBehaviour', () => {
  let backtracking: BasicBacktrackingBehaviour

  beforeEach(() => {
    backtracking = new BasicBacktrackingBehaviour(
      {platformMetadata: {}} as IContext,
      {navigateTo: async (_b, _c) => ({interaction: {} as IBlockInteraction, prompt: undefined})},
      {
        buildPromptFor: async (_b: IBlock, _i: IBlockInteraction):
          Promise<IPrompt<IPromptConfig<any> & IBasePromptConfig> | undefined> => undefined,
      })
  })

  describe('peek', () => {
    let virtualPrompt: IPrompt<any>

    beforeEach(() => {
      backtracking.context = {
        interactions: [
          // assumption: all of these are interactive
          {uuid: 'intx-123'},
          {uuid: 'intx-234'},
          {uuid: 'intx-345', flowId: 'flow-123', blockId: 'block-123', value: 'value #345'},
          {uuid: 'intx-456'},
          {uuid: 'intx-567'},
          {uuid: 'intx-678', flowId: 'flow-123', blockId: 'block-123', value: 'value #678'},
        ] as IBlockInteraction[],
        flows: [
          {uuid: 'flow-123', blocks: [{uuid: 'block-123'} as IBlock]} as IFlow,
        ] as IFlow[],
      } as IContext

      virtualPrompt = {} as IPrompt<any>

      jest.spyOn(backtracking.promptBuilder, 'buildPromptFor')
        .mockReturnValue(Promise.resolve(virtualPrompt))
    })

    it('should return prompt for last interaction when no args provided', async () => {
      const block: IBlock = backtracking.context.flows[0].blocks[0]
      const interaction: IBlockInteraction = last(backtracking.context.interactions)!

      const cursor = await backtracking.peek()
      expect(backtracking.promptBuilder.buildPromptFor).toHaveBeenCalledWith(block, interaction)
      expect(interaction.value).toBeTruthy()
      expect(cursor.prompt).toBe(virtualPrompt)
      expect(cursor.prompt.value).toEqual(interaction.value)
    })

    it('should use interaction `steps` places from the end of interactions list', async () => {
      const block: IBlock = backtracking.context.flows[0].blocks[0]
      const interaction: IBlockInteraction = backtracking.context.interactions[2]

      const cursor = await backtracking.peek(3)
      expect(backtracking.promptBuilder.buildPromptFor).toHaveBeenCalledWith(block, interaction)
      expect(interaction.value).toBeTruthy()
      expect(cursor.prompt).toBe(virtualPrompt)
      expect(cursor.prompt.value).toEqual(interaction.value)
    })

    it('should skip over non-interactive blocks', async () => {
      backtracking.context.interactions[3].type = first(NON_INTERACTIVE_BLOCK_TYPES)!
      backtracking.context.interactions[4].type = first(NON_INTERACTIVE_BLOCK_TYPES)!

      const block: IBlock = backtracking.context.flows[0].blocks[0]
      const interaction: IBlockInteraction = backtracking.context.interactions[2]

      const cursor = await backtracking.peek(1)
      expect(backtracking.promptBuilder.buildPromptFor).toHaveBeenCalledWith(block, interaction)
      expect(interaction.value).toBeTruthy()
      expect(cursor.prompt).toBe(virtualPrompt)
      expect(cursor.prompt.value).toEqual(interaction.value)
    })

    it('should raise when trying to step back further than can be stepped', async () => {
      await expect(BacktrackingBehaviour.prototype.peek.bind(backtracking)(7))
        .rejects
        .toThrow('Unable to backtrack to an interaction that far back {"steps":7}')
    })
  })
})
