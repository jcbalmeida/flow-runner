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

 import IContactProperty from './IContactProperty'

export class ContactProperty implements IContactProperty {
  deletedAt: string | undefined
  createdAt: string = Date.now().toString()
  updatedAt: string = Date.now().toString()
  __value__!: string
  id!: string

  constructor() {}

  get contactPropertyFieldName(): string {
      return this.contactPropertyFieldName
  }

  set contactPropertyFieldName(contactPropertyFieldName: string) {
      this.contactPropertyFieldName = contactPropertyFieldName
      this.updatedAt = Date.now().toString()
  }

  get orgId(): string {
      return this.orgId
  }

  set orgId(orgId: string) {
      this.orgId = orgId
      this.updatedAt = Date.now().toString()
  }

  get value(): string {
      return this.__value__
  }

  set value(value: string) {
      this.__value__ = value
      this.updatedAt = Date.now().toString()
  }
}

export default ContactProperty
