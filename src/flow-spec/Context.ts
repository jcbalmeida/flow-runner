import IContext, {CursorType} from './IContext'
import IFlow from './IFlow'
import IContact from './IContact'
import DeliveryStatus from './DeliveryStatus'
import IBlockInteraction from './IBlockInteraction'
import {IResource, IResources, SupportedMode} from '..'
import ResourceResolver from '../domain/ResourceResolver'

export default class Context implements IContext {
  constructor(
    public id: string,
    public createdAt: string,
    public deliveryStatus: DeliveryStatus,

    public mode: SupportedMode,
    public languageId: string,

    public contact: IContact,
    public sessionVars: object,
    public interactions: IBlockInteraction[],
    public nestedFlowBlockInteractionIdStack: string[],

    public flows: IFlow[],
    public firstFlowId: string,
    public resources: IResources,

    public entryAt?: string,
    public exitAt?: string,
    public userId?: string,
    public cursor?: CursorType,
  ) {}

  getResource(resourceId: string): IResource {
    return new ResourceResolver(this)
      .resolve(resourceId)
  }
}