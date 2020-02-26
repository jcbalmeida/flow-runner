"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const __1 = require("../..");
const DateFormat_1 = tslib_1.__importDefault(require("../DateFormat"));
class LogBlockRunner {
    constructor(block, context) {
        this.block = block;
        this.context = context;
    }
    initialize() {
        return;
    }
    run() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.context.logs[DateFormat_1.default()] =
                __1.evaluateToString(this.block.config.message, this.context);
            return this.block.exits[0];
        });
    }
}
exports.LogBlockRunner = LogBlockRunner;
exports.default = LogBlockRunner;
//# sourceMappingURL=LogBlockRunner.js.map