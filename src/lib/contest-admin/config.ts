import raw from '@spec/contest-admin.config.json';

export type ContestStep = 'BASICS' | 'AUDIENCE' | 'QUALIFICATION' | 'CALCULATION' | 'REWARDS' | 'GOVERNANCE' | 'REVIEW';

export interface ContestAdminConfig {
  configVersion: string;
  country: string;
  module: 'contest-admin';
  routes: Array<{ code: string; route: string; enabled: boolean }>;
  builder: { stepOrder: ContestStep[]; periodModes: string[]; maxRuleDepth: number; maxRuleNodes: number };
  capabilities: Record<string, boolean>;
}

export const contestAdminConfig = raw as ContestAdminConfig;