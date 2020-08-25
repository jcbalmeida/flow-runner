/**
 * Flow Interoperability Project (flowinterop.org)
 * Flow Runner
 * Copyright (c) 2019, 2020 Viamo Inc.
 * Authored by: Brett Zabos (brett.zabos@viamo.io)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 **/

import {evaluateToString, IBlockExit, IBlockRunner, IContext, IPrintBlock} from '../..'

/**
 * Block runner for `ConsoleIO\Print` - Prints a message to standard output, by evaluating an expression.
 */
export class PrintBlockRunner implements IBlockRunner {
  constructor(
    public block: IPrintBlock,
    public context: IContext,
    public console: Console = console,
  ) {
  }

  async initialize(): Promise<undefined> {
    return
  }

  async run(): Promise<IBlockExit> {
    this.console.log(
      this.block.type,
      evaluateToString(this.block.config.message, this.context))

    // todo: should we also write this as the value of the block interaction like the output block?
    return this.block.exits[0]
  }
}
