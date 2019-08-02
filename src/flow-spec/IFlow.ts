// import UUID32 from "../model/UUID32";
import IBlock from "./IBlock";
import {Mode} from "./Mode";
import {find} from 'lodash'


export default interface IFlow {
  uuid: string//UUID32
  name: string
  label?: string
  last_modified: Date // UTC like: 2016-12-25 13:42:05.234598
  interaction_timeout: number
  platform_metadata: object
  supported_modes: Mode[] // enum
  languages: string[] // eunm for ISO 639-3 codes
  blocks: IBlock[]
}

export function findBlockWith(uuid: string, {blocks}: IFlow): IBlock {
  const block = find(blocks, {uuid})
  if (!block) {
    throw new Error('Unable to find block on flow')
  }

  return block
}
