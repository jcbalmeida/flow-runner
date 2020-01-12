import {update, NonBreakingUpdateOperation} from 'sp2'

import {trimEnd, lowerFirst} from 'lodash'
import IBlock, {findBlockExitWith} from '../flow-spec/IBlock'
import IContext, {
  TCursor,
  findBlockOnActiveFlowWith,
  findInteractionWith,
  getActiveFlowFrom,
  getActiveFlowIdFrom,
  IContextWithCursor, IReversibleUpdateOperation,
  TRichCursorInputRequired,
  TRichCursor,
} from '../flow-spec/IContext'
import IBlockRunner from './runners/IBlockRunner'
import IBlockInteraction from '../flow-spec/IBlockInteraction'
import IBlockExit from '../flow-spec/IBlockExit'
import {find, first, includes, last} from 'lodash'
import IFlowRunner, {IBlockRunnerFactoryStore, TBlockRunnerFactory} from './IFlowRunner'
import IIdGenerator from './IIdGenerator'
import IdGeneratorUuidV4 from './IdGeneratorUuidV4'
import ValidationException from './exceptions/ValidationException'
import {IPromptConfig, KnownPrompts} from './prompt/IPrompt'
import MessagePrompt from './prompt/MessagePrompt'
import DeliveryStatus from '../flow-spec/DeliveryStatus'
import NumericPrompt from './prompt/NumericPrompt'
import OpenPrompt from './prompt/OpenPrompt'
import SelectOnePrompt from './prompt/SelectOnePrompt'
import SelectManyPrompt from './prompt/SelectManyPrompt'
import IBehaviour, {IBehaviourConstructor} from './behaviours/IBehaviour'
// import BacktrackingBehaviour from './behaviours/BacktrackingBehaviour/BacktrackingBehaviour'
import BasicBacktrackingBehaviour from './behaviours/BacktrackingBehaviour/BasicBacktrackingBehaviour'
import MessageBlockRunner from './runners/MessageBlockRunner'
import IMessageBlock from '../model/block/IMessageBlock'
import OpenResponseBlockRunner from './runners/OpenResponseBlockRunner'
import IOpenResponseBlock from '../model/block/IOpenResponseBlock'
import NumericResponseBlockRunner from './runners/NumericResponseBlockRunner'
import INumericResponseBlock from '../model/block/INumericResponseBlock'
import SelectOneResponseBlockRunner from './runners/SelectOneResponseBlockRunner'
import ISelectOneResponseBlock from '../model/block/ISelectOneResponseBlock'
import SelectManyResponseBlockRunner from './runners/SelectManyResponseBlockRunner'
import CaseBlockRunner from './runners/CaseBlockRunner'
import ICaseBlock from '../model/block/ICaseBlock'
import ResourceResolver from './ResourceResolver'
import {IResource} from './IResourceResolver'
import {TGenericPrompt} from './prompt/BasePrompt'
import RunFlowBlockRunner from './runners/RunFlowBlockRunner'
import ReadBlockRunner from './runners/ReadBlockRunner'
import PrintBlockRunner from './runners/PrintBlockRunner'
import LogBlockRunner from './runners/LogBlockRunner'
import OutputBlockRunner from './runners/OutputBlockRunner'
import IOutputBlock from '../model/block/IOutputBlock'
import ILogBlock from '../model/block/ILogBlock'
import IPrintBlock from '../model/block/IPrintBlock'
import IReadBlock from '../model/block/IReadBlock'
import IRunFlowBlock from '../model/block/IRunFlowBlock'
import ReadPrompt from './prompt/ReadPrompt'


export class BlockRunnerFactoryStore
  extends Map<string, TBlockRunnerFactory>
  implements IBlockRunnerFactoryStore {
}

export interface IFlowNavigator {
  navigateTo(block: IBlock, ctx: IContext): TRichCursor
}

export interface IPromptBuilder {
  buildPromptFor(block: IBlock, interaction: IBlockInteraction):
    TGenericPrompt | undefined
}

const DEFAULT_BEHAVIOUR_TYPES: IBehaviourConstructor[] = [
  BasicBacktrackingBehaviour,
  // BacktrackingBehaviour,
]

export const NON_INTERACTIVE_BLOCK_TYPES = [
  'Core\\Case',
  'Core\\RunFlow',
]

export function createDefaultBlockRunnerStore(): IBlockRunnerFactoryStore {
  return new BlockRunnerFactoryStore([
    ['MobilePrimitives\\Message', (block, ctx) => new MessageBlockRunner(block as IMessageBlock, ctx)],
    ['MobilePrimitives\\OpenResponse', (block, ctx) => new OpenResponseBlockRunner(block as IOpenResponseBlock, ctx)],
    ['MobilePrimitives\\NumericResponse', (block, ctx) => new NumericResponseBlockRunner(block as INumericResponseBlock, ctx)],
    ['MobilePrimitives\\SelectOneResponse', (block, ctx) => new SelectOneResponseBlockRunner(block as ISelectOneResponseBlock, ctx)],
    ['MobilePrimitives\\SelectManyResponse', (block, ctx) => new SelectManyResponseBlockRunner(block as ISelectOneResponseBlock, ctx)],
    ['Core\\Case', (block, ctx) => new CaseBlockRunner(block as ICaseBlock, ctx)],
    ['Core\\Output', (block, ctx) => new OutputBlockRunner(block as IOutputBlock, ctx)],
    ['Core\\Log', (block, ctx) => new LogBlockRunner(block as ILogBlock, ctx)],
    ['ConsoleIO\\Print', (block, ctx) => new PrintBlockRunner(block as IPrintBlock, ctx)],
    ['ConsoleIO\\Read', (block, ctx) => new ReadBlockRunner(block as IReadBlock, ctx)],
    ['Core\\RunFlow', (block, ctx) => new RunFlowBlockRunner(block as IRunFlowBlock, ctx)]])
}

// todo: flesh this out as an extensibile store that can be DI'd like runners
export function createKindPromptMap() {
  return {
    [KnownPrompts.Message.toString()]: MessagePrompt,
    [KnownPrompts.Numeric.toString()]: NumericPrompt,
    [KnownPrompts.Open.toString()]: OpenPrompt,
    [KnownPrompts.Read.toString()]: ReadPrompt,
    [KnownPrompts.SelectOne.toString()]: SelectOnePrompt,
    [KnownPrompts.SelectMany.toString()]: SelectManyPrompt,
  }
}

export class FlowRunner implements IFlowRunner, IFlowNavigator, IPromptBuilder {
  constructor(
    public context: IContext,
    public runnerFactoryStore: IBlockRunnerFactoryStore = createDefaultBlockRunnerStore(),
    protected idGenerator: IIdGenerator = new IdGeneratorUuidV4,
    public behaviours: { [key: string]: IBehaviour } = {},
  ) {
    this.initializeBehaviours(DEFAULT_BEHAVIOUR_TYPES)
  }

  /**
   * Take list of constructors and initialize them like: ```
   * runner.initializeBehaviours([MyFirstBehaviour, MySecondBehaviour])
   * runner.behaviours.myFirst instanceof MyFirstBehaviour
   * runner.behaviours.mySecond instanceof MySecondBehaviour
   * ``` */
  initializeBehaviours(behaviourConstructors: IBehaviourConstructor[]): void {
    behaviourConstructors.forEach(b =>
      this.behaviours[lowerFirst(trimEnd(b.name, 'Behaviour|Behavior'))]
        = new b(this.context, this, this))
  }

  /**
   * We want to call start when we don't have a prompt needing work to be done. */
  initialize(): TRichCursor | undefined {
    const ctx = this.context
    const block = this.findNextBlockOnActiveFlowFor(ctx)

    if (block == null) {
      throw new ValidationException('Unable to initialize flow without blocks.')
    }

    ctx.deliveryStatus = DeliveryStatus.IN_PROGRESS
    ctx.entryAt = (new Date).toISOString().replace('T', ' ')

    return this.navigateTo(block, this.context) // kick-start by navigating to first block
  }

  isInitialized(ctx: IContext): boolean {
    // const {cursor, entryAt, exitAt} = ctx
    // return cursor && entryAt && !exitAt

    return ctx.cursor != null
  }

  isFirst(): boolean {
    const {cursor, interactions} = this.context

    if (!this.isInitialized(this.context)) {
      return true
    }

    const firstInteractiveIntx = find(interactions, ({type}) =>
      !includes(NON_INTERACTIVE_BLOCK_TYPES, type))

    if (firstInteractiveIntx == null) {
      return true
    }

    return firstInteractiveIntx.uuid === cursor![0]
  }

  isLast(): boolean {
    const {cursor, interactions} = this.context

    if (!this.isInitialized(this.context)) {
      return true
    }

    return last(interactions)!.uuid === cursor![0]
  }

  /**
   * We want to call resume when we have a prompt needing work to be wrapped up on it.
   *
   * I'm wondering if these need to be treated differently. The concern is that resume _assumes_ a particular state;
   * eg. cursor with a prompt requiring input
   *
   * The issue is that we may, in fact, end up needing to resume from a state where a particular block
   *    got itself into an invalid state and _crashed_, in which case, we'd still want the ability to pick up
   *    where we'd left off. */
  run(): TRichCursorInputRequired | undefined {
    const {context: ctx} = this
    if (!this.isInitialized(ctx)) {
      /* const richCursor = */
      this.initialize()
    }

    return this.runUntilInputRequiredFrom(ctx as IContextWithCursor)
  }

  isInputRequiredFor(ctx: IContext): boolean /* : ctx is TRichCursorInputRequired*/ {
    return ctx.cursor != null
      && ctx.cursor[1] != null
      && ctx.cursor[1].value === undefined
  }

  // todo: this could be extracted to an Expressions Behaviour
  //       ie. cacheInteractionByBlockName, applyReversibleDataOperation and reverseLastDataOperation
  cacheInteractionByBlockName(
    {uuid, entryAt}: IBlockInteraction,
    {name, config: {prompt}}: IMessageBlock,
    context: IContext=this.context): void {

    if (!('blockInteractionsByBlockName' in this.context.sessionVars)) {
      context.sessionVars.blockInteractionsByBlockName = {}
    }

    if (context.reversibleOperations == null) {
      context.reversibleOperations = []
    }

    // create a cache of `{[block.name]: {...}}` for subsequent lookups
    const blockNameKey = `blockInteractionsByBlockName.${name}`
    const previous = this.context.sessionVars[blockNameKey]
    const resource: IResource | undefined = prompt == null
      ? undefined
      : new ResourceResolver(context).resolve(prompt)

    const current = {
      __interactionId: uuid,
      time: entryAt,
      text: resource != null && resource.hasText()
        ? resource.getText()
        : '',
    }

    this.applyReversibleDataOperation(
      {$set: {[blockNameKey]: current}},
      {$set: {[blockNameKey]: previous}})
  }

  applyReversibleDataOperation(
    forward: NonBreakingUpdateOperation,
    reverse: NonBreakingUpdateOperation,
    context: IContext=this.context): void {

    context.sessionVars = update(context.sessionVars, forward)
    context.reversibleOperations.push({
      interactionId: last(context.interactions)?.uuid,
      forward,
      reverse,
    })
  }

  reverseLastDataOperation(context: IContext=this.context): IReversibleUpdateOperation | undefined {
    if (context.reversibleOperations.length === 0) {
      return
    }

    const lastOperation = last(context.reversibleOperations) as IReversibleUpdateOperation
    context.sessionVars = update(context.sessionVars, lastOperation.reverse)
    return context.reversibleOperations.pop()
  }

  runUntilInputRequiredFrom(ctx: IContextWithCursor): TRichCursorInputRequired | undefined {
    /* todo: convert cursor to an object instead of tuple; since we don't have named tuples, a dictionary
        would be more intuitive */
    let richCursor: TRichCursor = this.hydrateRichCursorFrom(ctx)
    let block: IBlock | undefined = findBlockOnActiveFlowWith(richCursor[0].blockId, ctx)

    do {
      if (this.isInputRequiredFor(ctx)) {
        console.info('Attempted to resume when prompt is not yet fulfilled; resurfacing same prompt instance.')
        return richCursor as TRichCursorInputRequired
      }

      this.runActiveBlockOn(richCursor, block)

      block = this.findNextBlockOnActiveFlowFor(ctx)

      if (block == null) {
        block = this.stepOut(ctx)
      }

      if (block == null) {
        continue // bail-- we're done.
      }

      if (block.type === 'Core\\RunFlow') {
        richCursor = this.navigateTo(block, ctx)
        block = this.stepInto(block, ctx)
      }

      if (block == null) {
        continue // bail-- we done.
      }

      richCursor = this.navigateTo(block, ctx)

    } while (block != null)

    this.complete(ctx)
    return
  }

  // exitEarlyThrough(block: IBlock) {
    // todo: generate link from current interaction to exit block (flow.exitBlockId)
    // todo: raise if flow.exitBlockId not defined
    // todo: set delivery status on context as INCOMPLETE
  // }

  complete(ctx: IContext): void {
    // todo: set exitAt on context
    // todo: set delivery status on context as COMPLETE

    (last(ctx.interactions) as IBlockInteraction).exitAt = (new Date).toISOString().replace('T', ' ')
    delete ctx.cursor
    ctx.deliveryStatus = DeliveryStatus.FINISHED_COMPLETE
    ctx.exitAt = (new Date).toISOString().replace('T', ' ')
  }

  dehydrateCursor(richCursor: TRichCursor): TCursor {
    return [richCursor[0].uuid, richCursor[1] != null ? richCursor[1].config : undefined]
  }

  hydrateRichCursorFrom(ctx: IContextWithCursor): TRichCursor {
    const {cursor} = ctx
    const interaction = findInteractionWith(cursor[0], ctx)
    return [interaction, this.createPromptFrom(cursor[1], interaction)]
  }

  initializeOneBlock(
    block: IBlock,
    flowId: string,
    originFlowId?: string,
    originBlockInteractionId?: string,
  ): TRichCursor {
    let interaction = this.createBlockInteractionFor(block, flowId, originFlowId, originBlockInteractionId)

    Object.values(this.behaviours)
      .forEach(b => interaction = b.postInteractionCreate(interaction, this.context))

    return [interaction, this.buildPromptFor(block, interaction)]
  }

  runActiveBlockOn(richCursor: TRichCursor, block: IBlock): IBlockExit {
    // todo: write test to guard against already isSubmitted at this point

    if (richCursor[1] != null) {
      richCursor[0].value = richCursor[1].value
      richCursor[0].hasResponse = true
    }

    const exit = this.createBlockRunnerFor(block, this.context)
      .run(richCursor)

    richCursor[0].selectedExitId = exit.uuid

    if (richCursor[1] != null) {
      richCursor[1].config.isSubmitted = true
    }

    Object.values(this.behaviours)
      .forEach(b => b.postInteractionComplete(richCursor[0], this.context))

    return exit
  }

  createBlockRunnerFor(block: IBlock, ctx: IContext): IBlockRunner {
    const factory = this.runnerFactoryStore.get(block.type)
    if (factory == null) { // todo: need to pass as no-op for beta
      throw new ValidationException(`Unable to find factory for block type: ${block.type}`)
    }

    return factory(block, ctx)
  }

  navigateTo(block: IBlock, ctx: IContext, navigatedAt: Date = new Date): TRichCursor {
    const {interactions, nestedFlowBlockInteractionIdStack} = ctx
    const flowId = getActiveFlowIdFrom(ctx)
    const originInteractionId = last(nestedFlowBlockInteractionIdStack)
    const originInteraction = originInteractionId != null
      ? findInteractionWith(originInteractionId, ctx)
      : null

    const richCursor = this.initializeOneBlock(
      block,
      flowId,
      originInteraction == null ? undefined : originInteraction.flowId,
      originInteractionId)

    // todo: this could be extracted to an Expressions Behaviour
    this.cacheInteractionByBlockName(richCursor[0], block as IMessageBlock, this.context)

    const lastInteraction = last(interactions)
    if (lastInteraction != null) {
      lastInteraction.exitAt = navigatedAt.toISOString().replace('T', ' ')
    }

    interactions.push(richCursor[0])
    ctx.cursor = this.dehydrateCursor(richCursor)

    return richCursor
  }

  /**
   * Stepping into is the act of moving into a child flow.
   * However, we can't move into a child flow without a cursor indicating we've moved.
   * `stepInto()` needs to be the thing that discovers ya from xa (via first on flow in flows list)
   * Then generating a cursor that indicates where we are.
   * ?? -> xa ->>> ya -> yb ->>> xb
   *
   * todo: would it be possible for stepping into and out of be handled by the RunFlow itself?
   *       Eg. these are esentially RunFlowRunner's .start() + .resume() equivalents */
  stepInto(runFlowBlock: IBlock, ctx: IContext): IBlock | undefined {
    if (runFlowBlock.type !== 'Core\\RunFlow') {
      throw new ValidationException('Unable to step into a non-Core\\RunFlow block type')
    }

    const runFlowInteraction = last(ctx.interactions)
    if (runFlowInteraction == null) {
      throw new ValidationException('Unable to step into Core\\RunFlow that hasn\'t yet been started')
    }

    if (runFlowBlock.uuid !== runFlowInteraction.blockId) {
      throw new ValidationException('Unable to step into Core\\RunFlow block that doesn\'t match last interaction')
    }

    ctx.nestedFlowBlockInteractionIdStack.push(runFlowInteraction.uuid)

    const firstNestedBlock = first(getActiveFlowFrom(ctx).blocks) // todo: use IFlow.firstBlockId
    if (firstNestedBlock == null) {
      return undefined
    }

    runFlowInteraction.selectedExitId = runFlowBlock.exits[0].uuid

    return firstNestedBlock
  }

  /**
   * Stepping out is the act of moving back into parent flow.
   * However, we can't move up into parent flow without a cursor indicating we've moved.
   * `stepOut()` needs to be the things that discovers xb from xa (via nfbistack)
   * Then generating a cursor that indicates where we are.
   * ?? -> xa ->>> ya -> yb ->>> xb
   *
   * @note Does this push cursor into an out-of-sync state?
   *       Not when stepping out, because when stepping out, we're connecting previous RunFlow output
   *       to next block; when stepping IN, we need an explicit navigation to inject RunFlow in between
   *       the two Flows. */
  stepOut(ctx: IContext): IBlock | undefined {
    const {nestedFlowBlockInteractionIdStack} = ctx

    if (nestedFlowBlockInteractionIdStack.length === 0) {
      return
    }

    const lastParentInteractionId = nestedFlowBlockInteractionIdStack.pop() as string
    const {blockId: lastRunFlowBlockId} = findInteractionWith(lastParentInteractionId, ctx)
    const lastRunFlowBlock = findBlockOnActiveFlowWith(lastRunFlowBlockId, ctx)
    const {destinationBlock} = first(lastRunFlowBlock.exits) as IBlockExit

    if (destinationBlock == null) {
      return
    }

    return findBlockOnActiveFlowWith(destinationBlock, ctx)
  }

  findNextBlockOnActiveFlowFor(ctx: IContext): IBlock | undefined {
    // cursor: TRichCursor | null, flow: IFlow): IBlock | null {
    const flow = getActiveFlowFrom(ctx)
    const {cursor} = ctx

    if (cursor == null) {
      return first(flow.blocks) // todo: use IFlow.firstBlockId
    }

    const interaction = findInteractionWith(cursor[0], ctx)
    return this.findNextBlockFrom(interaction, ctx)
  }

  findNextBlockFrom(interaction: IBlockInteraction, ctx: IContext): IBlock | undefined {
    if (interaction.selectedExitId == null) {
      // todo: maybe tighter check on this, like: prompt.isFulfilled() === false || !called block.run()
      throw new ValidationException(
        'Unable to navigate past incomplete interaction; did you forget to call runner.run()?')
    }

    const block = findBlockOnActiveFlowWith(interaction.blockId, ctx)
    const {destinationBlock} = findBlockExitWith(interaction.selectedExitId, block)
    const {blocks} = getActiveFlowFrom(ctx)

    return find(blocks, {uuid: destinationBlock})
  }

  private createBlockInteractionFor(
    {uuid: blockId, type}: IBlock,
    flowId: string,
    originFlowId: string | undefined,
    originBlockInteractionId: string | undefined): IBlockInteraction {

    return {
      uuid: this.idGenerator.generate(),
      blockId,
      flowId,
      entryAt: (new Date).toISOString().replace('T', ' '),
      exitAt: undefined,
      hasResponse: false,
      value: undefined,
      selectedExitId: null,
      details: {},
      type,

      // Nested flows:
      originFlowId,
      originBlockInteractionId,
    }
  }

  buildPromptFor(block: IBlock, interaction: IBlockInteraction):
    TGenericPrompt | undefined {

    const runner = this.createBlockRunnerFor(block, this.context)
    const promptConfig = runner.initialize(interaction)
    return this.createPromptFrom(promptConfig, interaction)
  }

  private createPromptFrom(config?: IPromptConfig<any>, interaction?: IBlockInteraction):
    TGenericPrompt | undefined {

    if (config == null || interaction == null) {
      return
    }

    const promptConstructor = createKindPromptMap()[config.kind]
    // @ts-ignore
    return new promptConstructor(config, interaction.uuid, this)
  }
}

export default FlowRunner