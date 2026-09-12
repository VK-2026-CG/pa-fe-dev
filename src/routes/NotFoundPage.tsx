import { useRouteError } from 'react-router-dom';
import { CdkFeatureDisabledError } from '@/cdk/registry';

/**
 * The route tree's `errorElement`, also rendered for `path: '*'`. Only an
 * unmatched route or a feature disabled in the deployment's LBU manifest is a
 * 404; anything else reaching here is a genuine failure and must stay loud
 * instead of masquerading as a missing page — `resolveCdk` throws a plain
 * `Error` for an unregistered feature, which is a configuration bug.
 */
export default function NotFoundPage() {
  const error = useRouteError();
  if (error && !(error instanceof CdkFeatureDisabledError)) {
    return (
      <div className="section card pad" role="alert">
        <h1>Something went wrong</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
  return (
    <div className="section card pad" role="alert">
      <h1>404</h1>
      <p>{error ? 'This feature is not available for your deployment.' : 'Page not found.'}</p>
    </div>
  );
}
