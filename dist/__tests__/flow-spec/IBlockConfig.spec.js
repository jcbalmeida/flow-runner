"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IBlockConfig_1 = require("../../model/block/IBlockConfig");
describe('IBlockConfig', () => {
    it('asserts the type of ISetContactPropertyBlockConfig', () => {
        const trueCase = {
            set_contact_property: {
                property_key: 'foo',
                property_value: 'bar',
            },
        };
        const falseCase = {};
        expect(IBlockConfig_1.isSetContactPropertyConfig(trueCase)).toBeTruthy();
        expect(IBlockConfig_1.isSetContactPropertyConfig(falseCase)).toBeFalsy();
    });
});
//# sourceMappingURL=IBlockConfig.spec.js.map