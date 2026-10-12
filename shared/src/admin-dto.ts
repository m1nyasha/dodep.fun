export type AdminActionKind =
  'block' | 'unblock' | 'hide_status' | 'show_status' | 'rules_create' | 'rules_activate' | 'settings_update';

export interface AdminTicketDto {
  url: string;
}

export interface AdminMeDto {
  nickname: string;
}

export interface ExchangeBody {
  ticket: string;
}

export interface ReasonBody {
  reason: string;
}

export interface AdminActionDto {
  id: string;
  action: AdminActionKind;
  admin: string;
  target: string | null;
  reason: string | null;
  payload: unknown;
  createdAt: string;
}

export interface AdminActionsPageDto {
  items: AdminActionDto[];
  total: number;
}

export interface AdminOverviewDto {
  accounts: number;
  aiAccounts: number;
  blocked: number;
  hiddenStatuses: number;
  rounds: number;
  activeRuleVersion: number;
  recentActions: AdminActionDto[];
}

export interface RuleVersionFields {
  rtp: number;
  minBet: number;
  betStep: number;
  startBalance: number;
  dailyTarget: number;
}

export interface RuleVersionInput extends RuleVersionFields {
  reason?: string;
}

export interface RuleVersionDto extends RuleVersionFields {
  version: number;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface AdminAccountDto {
  nickname: string;
  isAi: boolean;
  aiType: string | null;
  isAdmin: boolean;
  balance: number;
  net: number;
  roundsCount: number;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
}

export interface AdminAccountsPageDto {
  items: AdminAccountDto[];
  total: number;
}

export interface FingerprintDto {
  event: 'register' | 'login' | 'register_denied';
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  clientHash: string | null;
  createdAt: string;
}

export interface RelatedAccountDto {
  nickname: string;
  via: 'ip' | 'client';
  value: string;
  blocked: boolean;
}

export interface AdminAccountDetailDto {
  account: AdminAccountDto;
  status: { text: string | null; hiddenAt: string | null; updatedAt: string | null };
  fingerprints: FingerprintDto[];
  related: RelatedAccountDto[];
}

export interface AdminStatusDto {
  nickname: string;
  text: string;
  hiddenAt: string | null;
  updatedAt: string | null;
  humanRank: number | null;
}

export interface RegistrationLimitDto {
  count: number;
  windowHours: number;
}

export type ExportKind = 'rounds' | 'actions';
export type ExportFormat = 'csv' | 'json';

export interface ExportParams {
  kind: ExportKind;
  format: ExportFormat;
  experimentId?: string;
  isAi?: 'true' | 'false';
  from?: string;
  to?: string;
}
