"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const DateFormat_1 = require("../domain/DateFormat");
class Contact {
    constructor() { }
    setProperty(name, value) {
        const prop = {
            __value__: value,
            value: value,
            contactPropertyFieldName: name,
            createdAt: DateFormat_1.createFormattedDate(),
            updatedAt: DateFormat_1.createFormattedDate(),
            deletedAt: undefined,
        };
        this[name] = prop;
        return prop;
    }
    getProperty(name) {
        if (this[name] == null) {
            return undefined;
        }
        return this[name];
    }
}
exports.Contact = Contact;
exports.default = Contact;
//# sourceMappingURL=Contact.js.map