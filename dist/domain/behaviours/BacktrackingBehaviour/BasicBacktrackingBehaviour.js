"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const IContext_1 = require("../../../flow-spec/IContext");
const ValidationException_1 = tslib_1.__importDefault(require("../../exceptions/ValidationException"));
const FlowRunner_1 = tslib_1.__importStar(require("../../FlowRunner"));
const __1 = require("../../..");
class BasicBacktrackingBehaviour {
    constructor(context, navigator, promptBuilder) {
        this.context = context;
        this.navigator = navigator;
        this.promptBuilder = promptBuilder;
    }
    rebuildIndex() {
    }
    seek(steps = 0, context = this.context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { interaction: prevIntx, prompt: virtualPrompt } = yield this.peek(steps, context);
            const cursor = yield this.jumpTo(prevIntx, context);
            cursor.prompt.value = virtualPrompt.value;
            return cursor;
        });
    }
    jumpTo(intx, context = this.context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const discarded = context.interactions.splice(lodash_1.findLastIndex(context.interactions, intx), context.interactions.length);
            lodash_1.forEachRight(discarded, intx => intx.uuid === lodash_1.last(context.nestedFlowBlockInteractionIdStack)
                ? context.nestedFlowBlockInteractionIdStack.pop()
                : null);
            lodash_1.forEachRight(discarded, ({ uuid }) => {
                var _a;
                while (((_a = lodash_1.last(context.reversibleOperations)) === null || _a === void 0 ? void 0 : _a.interactionId) === uuid) {
                    FlowRunner_1.default.prototype.reverseLastDataOperation(context);
                }
            });
            return this.navigator.navigateTo(IContext_1.findBlockOnActiveFlowWith(intx.blockId, context), context);
        });
    }
    peek(steps = 0, context = this.context) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let _steps = steps + 1;
            const intx = lodash_1.findLast(context.interactions, ({ type }) => !lodash_1.includes(FlowRunner_1.NON_INTERACTIVE_BLOCK_TYPES, type) && --_steps === 0);
            if (intx == null || _steps > 0) {
                throw new ValidationException_1.default(`Unable to backtrack to an interaction that far back ${JSON.stringify({ steps })}`);
            }
            const block = __1.findBlockWith(intx.blockId, IContext_1.findFlowWith(intx.flowId, context));
            const prompt = yield this.promptBuilder.buildPromptFor(block, intx);
            if (prompt == null) {
                throw new ValidationException_1.default(`Unable to build a prompt for ${JSON.stringify({
                    context: context.id,
                    intx,
                    block,
                })}`);
            }
            return {
                interaction: intx,
                prompt: Object.assign(prompt, { value: intx.value }),
            };
        });
    }
    postInteractionCreate(interaction, _context) {
        return interaction;
    }
    postInteractionComplete(_interaction, _context) {
    }
}
exports.BasicBacktrackingBehaviour = BasicBacktrackingBehaviour;
exports.default = BasicBacktrackingBehaviour;
//# sourceMappingURL=BasicBacktrackingBehaviour.js.map