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

/**
 * Block Exit: https://floip.gitbook.io/flow-specification/flows#exit-node-specification
 */
export interface IBlockExit {
  /**
   * A globally unique identifier for this Block.  (See UUID Format: https://floip.gitbook.io/flow-specification/flows#uuid-format)
   *
   * @pattern ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$
   */
  uuid: string

  /**
   * This is an identifier for the exit, suitable for use in rolling up results (e.g.: "male"), and to display on flowchart canvases.
   * Expressions can reference the name of the exit taken out of another block via @(flow.block_name.exit).
   */
  name: string

  /**
   * This is the uuid of the Block this exit connects to. It can be null if the exit does not connect to a block (if it is the final block).
   *
   * @pattern ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$
   */
  destination_block?: string

  /**
   * A user-controlled field that can be used to code the meaning of the data collected by this block in a standard taxonomy
   * or coding system, e.g.: a FHIR ValueSet, an industry-specific coding system like SNOMED CT,
   * or an organization's internal taxonomy service. (e.g. "SNOMEDCT::Feminine Gender")
   */
  semantic_label?: string

  /**
   * For blocks that evaluate conditions, this is an expression that determines whether this exit will be selected
   * as the path out of the block. The first exit with an expression that evaluates to a "truthy" value will be chosen.
   */
  test?: string

  /**
   * A set of key-value elements that is not controlled by the Specification,
   * but could be relevant to a specific vendor/platform/implementation.
   */
  vendor_metadata?: Record<string, any>

  /**
   * If this key is present and true, the exit is treated as the flow-through default in a case evaluation.
   * The block will terminate through this exit if no test expressions in other exits evaluate true..
   */
  // todo: should we rename this to isDefault to capture boolean type?
  // todo: we need to update docs -- they specify "key presence", but I'd prefer us to be more explicit
  default?: boolean
}
