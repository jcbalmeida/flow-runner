"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const ValidationException_1 = tslib_1.__importDefault(require("../domain/exceptions/ValidationException"));
const IContext_1 = require("./IContext");
const floip_expression_evaluator_ts_1 = require("floip-expression-evaluator-ts");
function findBlockExitWith(uuid, block) {
    const exit = lodash_1.find(block.exits, { uuid });
    if (exit == null) {
        throw new ValidationException_1.default('Unable to find exit on block');
    }
    return exit;
}
exports.findBlockExitWith = findBlockExitWith;
function findFirstTruthyEvaluatingBlockExitOn(block, context) {
    const { exits } = block;
    if (exits.length === 0) {
        throw new ValidationException_1.default(`Unable to find exits on block ${block.uuid}`);
    }
    const { cursor } = context;
    if (cursor == null || cursor[0] == null) {
        throw new ValidationException_1.default(`Unable to find cursor on context ${context.id}`);
    }
    const evalContext = createEvalContextFrom(context, block);
    return lodash_1.find(exits, ({ test }) => evaluateToBool(String(test), evalContext));
}
exports.findFirstTruthyEvaluatingBlockExitOn = findFirstTruthyEvaluatingBlockExitOn;
function findDefaultBlockExitOn(block) {
    const exit = lodash_1.find(block.exits, { default: true });
    if (exit == null) {
        throw new ValidationException_1.default(`Unable to find default exit on block ${block.uuid}`);
    }
    return exit;
}
exports.findDefaultBlockExitOn = findDefaultBlockExitOn;
function createEvalContextFrom(context, block) {
    const { contact, cursor, mode, languageId: language } = context;
    const prompt = cursor ? cursor[1] : undefined;
    return {
        contact,
        channel: { mode },
        flow: {
            ...IContext_1.getActiveFlowFrom(context),
            language,
        },
        block: {
            ...block,
            value: prompt ? prompt.value : undefined,
        },
    };
}
function evaluateToBool(expr, ctx) {
    const evaluator = floip_expression_evaluator_ts_1.EvaluatorFactory.create();
    const result = evaluator.evaluate(expr, ctx);
    return JSON.parse(result.toLocaleLowerCase());
}
//# sourceMappingURL=IBlock.js.map