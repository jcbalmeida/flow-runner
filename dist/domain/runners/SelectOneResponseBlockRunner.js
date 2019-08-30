"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
class SelectOneResponseBlockRunner {
    constructor(block) {
        this.block = block;
    }
    initialize() {
        const { prompt, choices } = this.block.config;
        return {
            kind: __1.KnownPrompts.SelectOne,
            prompt,
            isResponseRequired: true,
            choices: Object.keys(choices)
                .map(key => ({ key, value: choices[key] })),
        };
    }
    run() {
        return this.block.exits[0];
    }
}
exports.default = SelectOneResponseBlockRunner;
//# sourceMappingURL=SelectOneResponseBlockRunner.js.map