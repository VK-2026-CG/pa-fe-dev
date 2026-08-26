import type { RouteRef } from '@spec/performance-vm';

/** Resolve spec route tokens ("insights/metric-detail") to app URLs. */
export function href(nav: RouteRef): string {
  const qs = nav.params ? `?${new URLSearchParams(nav.params).toString()}` : '';
  return `/${nav.route}${qs}`;
}
