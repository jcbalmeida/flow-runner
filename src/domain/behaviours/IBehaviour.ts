import IBlockInteraction from '../../flow-spec/IBlockInteraction'
import IContext from '../../flow-spec/IContext'
import {IFlowNavigator, IPromptBuilder} from '../FlowRunner'


export interface IBehaviourConstructor {
  new (context: IContext,
       navigator: IFlowNavigator,
       promptBuilder: IPromptBuilder): IBehaviour
}

export interface IBehaviour {
  context: IContext
  navigator: IFlowNavigator
  promptBuilder: IPromptBuilder

  postInteractionCreate(interaction: IBlockInteraction, context: IContext): IBlockInteraction
  postInteractionComplete(interaction: IBlockInteraction, context: IContext): void
}

export default IBehaviour