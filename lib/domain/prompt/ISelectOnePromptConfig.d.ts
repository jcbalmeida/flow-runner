import { IPromptConfig, KnownPrompts } from './IPrompt';
export interface ISelectOnePromptConfig extends IPromptConfig<string | null> {
    kind: KnownPrompts.SelectOne;
    choices: IChoice[];
}
export interface IChoice {
    key: string;
    value: string;
    resourceId?: string;
}
//# sourceMappingURL=ISelectOnePromptConfig.d.ts.map