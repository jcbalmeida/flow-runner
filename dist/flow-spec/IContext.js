"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextService = exports.contextService = exports.isNested = exports.isLastBlockOn = exports.getActiveFlowFrom = exports.getActiveFlowIdFrom = exports.findNestedFlowIdFor = exports.findBlockOnActiveFlowWith = exports.findFlowWith = exports.findInteractionWith = exports.createContextDataObjectFor = void 0;
const __1 = require("..");
const lodash_1 = require("lodash");
function createContextDataObjectFor(contact, groups, userId, orgId, flows, languageId, mode = __1.SupportedMode.OFFLINE, resources = [], idGenerator = new __1.IdGeneratorUuidV4()) {
    return {
        id: idGenerator.generate(),
        createdAt: __1.createFormattedDate(),
        deliveryStatus: __1.DeliveryStatus.QUEUED,
        userId,
        orgId,
        mode,
        languageId,
        contact,
        groups,
        sessionVars: {},
        interactions: [],
        nestedFlowBlockInteractionIdStack: [],
        reversibleOperations: [],
        flows,
        firstFlowId: flows[0].uuid,
        resources,
        platformMetadata: {},
        logs: {},
    };
}
exports.createContextDataObjectFor = createContextDataObjectFor;
function findInteractionWith(uuid, { interactions }) {
    const interaction = lodash_1.findLast(interactions, { uuid });
    if (interaction == null) {
        throw new __1.ValidationException(`Unable to find interaction on context: ${uuid} in [${interactions.map(i => i.uuid)}]`);
    }
    return interaction;
}
exports.findInteractionWith = findInteractionWith;
function findFlowWith(uuid, { flows }) {
    const flow = lodash_1.find(flows, { uuid });
    if (flow == null) {
        throw new __1.ValidationException(`Unable to find flow on context: ${uuid} in ${flows.map(f => f.uuid)}`);
    }
    return flow;
}
exports.findFlowWith = findFlowWith;
function findBlockOnActiveFlowWith(uuid, ctx) {
    return __1.findBlockWith(uuid, getActiveFlowFrom(ctx));
}
exports.findBlockOnActiveFlowWith = findBlockOnActiveFlowWith;
function findNestedFlowIdFor(interaction, ctx) {
    const flow = findFlowWith(interaction.flowId, ctx);
    const runFlowBlock = __1.findBlockWith(interaction.blockId, flow);
    const flowId = runFlowBlock.config.flowId;
    if (flowId == null) {
        throw new __1.ValidationException('Unable to find nested flowId on Core\\RunFlow');
    }
    return flowId;
}
exports.findNestedFlowIdFor = findNestedFlowIdFor;
function getActiveFlowIdFrom(ctx) {
    const { firstFlowId, nestedFlowBlockInteractionIdStack } = ctx;
    if (nestedFlowBlockInteractionIdStack.length === 0) {
        return firstFlowId;
    }
    const interaction = findInteractionWith(lodash_1.last(nestedFlowBlockInteractionIdStack), ctx);
    return findNestedFlowIdFor(interaction, ctx);
}
exports.getActiveFlowIdFrom = getActiveFlowIdFrom;
function getActiveFlowFrom(ctx) {
    return findFlowWith(getActiveFlowIdFrom(ctx), ctx);
}
exports.getActiveFlowFrom = getActiveFlowFrom;
function isLastBlockOn(ctx, block) {
    return !isNested(ctx) && __1.isLastBlock(block);
}
exports.isLastBlockOn = isLastBlockOn;
function isNested({ nestedFlowBlockInteractionIdStack }) {
    return nestedFlowBlockInteractionIdStack.length > 0;
}
exports.isNested = isNested;
exports.contextService = {
    findInteractionWith,
    findFlowWith,
    findBlockOnActiveFlowWith,
    findNestedFlowIdFor,
    getActiveFlowIdFrom,
    getActiveFlowFrom,
    isLastBlockOn,
    isNested,
};
exports.ContextService = {
    findInteractionWith,
    findFlowWith,
    findBlockOnActiveFlowWith,
    findNestedFlowIdFor,
    getActiveFlowIdFrom,
    getActiveFlowFrom,
    isLastBlockOn,
    isNested,
};
//# sourceMappingURL=IContext.js.map