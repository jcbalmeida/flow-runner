// import UUID32 from "../model/UUID32";
import IBlock from './IBlock'
import {find} from 'lodash'
import ValidationException from '../domain/exceptions/ValidationException'
import SupportedMode from './SupportedMode'
import ILanguage from './ILanguage'

export interface IFlow {
  uuid: string // UUID32
  orgId: string
  name: string
  label?: string
  lastModified: string // UTC like: 2016-12-25 13:42:05.234598
  interactionTimeout: number
  platformMetadata: object

  supportedModes: SupportedMode[]
  languages: ILanguage[] // eunm for ISO 639-3 codes
  blocks: IBlock[]

  firstBlockId: string
  exitBlockId?: string
}

export default IFlow

export function findBlockWith(uuid: string, {blocks}: IFlow): IBlock {
  const block = find(blocks, {uuid})
  if (block == null) {
    throw new ValidationException('Unable to find block on flow')
  }

  return block
}
