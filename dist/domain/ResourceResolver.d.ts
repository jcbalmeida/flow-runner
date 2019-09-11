import IResourceResolver, { IResource } from './IResourceResolver';
import IContext from '../flow-spec/IContext';
export default class ResourceResolver implements IResourceResolver {
    context: IContext;
    constructor(context: IContext);
    resolve(resourceId: string): IResource;
}
//# sourceMappingURL=ResourceResolver.d.ts.map