import { IPromptConfig, KnownPrompts } from './IPrompt';
export interface INumericPromptConfig extends IPromptConfig<number | null> {
    kind: KnownPrompts.Numeric;
    min: number;
    max: number;
}
//# sourceMappingURL=INumericPromptConfig.d.ts.map