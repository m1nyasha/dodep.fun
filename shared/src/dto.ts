export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'NICKNAME_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_BLOCKED'
  | 'REGISTRATION_UNAVAILABLE'
  | 'BET_INVALID'
  | 'INSUFFICIENT_BALANCE'
  | 'ROUND_ACTIVE'
  | 'ROUND_NOT_FOUND'
  | 'CASH_OUT_UNAVAILABLE'
  | 'DAILY_UNAVAILABLE'
  | 'STATUS_FORBIDDEN'
  | 'PLAYER_NOT_FOUND'
  | 'ADMIN_ONLY'
  | 'TICKET_INVALID'
  | 'ACCOUNT_NOT_FOUND'
  | 'RULE_NOT_FOUND'
  | 'SELF_ACTION';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}

export interface RegisterBody {
  nickname: string;
  password: string;
  agree: true;
  clientHash?: string;
}

export interface LoginBody {
  nickname: string;
  password: string;
  clientHash?: string;
}

export interface LadderStepDto {
  k: number;
  chance: number;
  multiplier: number;
}

export interface RulesDto {
  version: number;
  rtp: number;
  minBet: number;
  betStep: number;
  startBalance: number;
  dailyTarget: number;
  cells: number;
  mines: number;
  ladder: LadderStepDto[];
}

export interface MeDto {
  nickname: string;
  balance: number;
  wagered: number;
  payout: number;
  net: number;
  roundsCount: number;
  rank: number | null;
  humanRank: number | null;
  status: string | null;
  statusHidden: boolean;
  nextDailyAt: string;
  dailyTarget: number;
  adminUrl: string | null;
}

export type RoundStatus = 'active' | 'cashed_out' | 'hit_mine';
export type RoundEndReason = 'mine' | 'cash_out' | 'all_safe';

interface RoundBaseDto {
  id: string;
  roundNo: number;
  bet: number;
  hash: string;
  ruleVersion: number;
  rtp: number;
  opened: number[];
  safeCount: number;
  startedAt: string;
}

export interface ActiveRoundDto extends RoundBaseDto {
  status: 'active';
  multiplier: number;
  potentialPayout: number;
}

export interface FinishedRoundDto extends RoundBaseDto {
  status: 'cashed_out' | 'hit_mine';
  endReason: RoundEndReason;
  multiplier: number;
  payout: number;
  net: number;
  hitCell: number | null;
  mines: number[];
  salt: string;
  finishedAt: string;
}

export type RoundDto = ActiveRoundDto | FinishedRoundDto;

export interface RoundResponseDto {
  round: RoundDto;
  balance: number;
}

export interface ActiveRoundResponseDto {
  round: ActiveRoundDto | null;
}

export interface RoundsPageDto {
  items: FinishedRoundDto[];
  nextCursor: number | null;
}

export interface PlayerDto {
  nickname: string;
  isAi: boolean;
  aiType: string | null;
  rank: number;
  humanRank: number | null;
  isTop: boolean;
  balance: number;
  net: number;
  roundsCount: number;
  status: string | null;
  createdAt: string;
}

export interface LeaderboardDto {
  items: PlayerDto[];
  total: number;
}

export type StatsScope = 'human' | 'ai';

export interface HistogramBucketDto {
  from: number;
  to: number | null;
  count: number;
}

export interface StatsDto {
  scope: StatsScope;
  accounts: number;
  rounds: number;
  wagered: number;
  payout: number;
  rtp: number | null;
  profitableShare: number | null;
  medianBalance: number | null;
  histogram: HistogramBucketDto[];
}

export interface DailyClaimDto {
  balance: number;
  added: number;
  nextDailyAt: string;
}

export interface StatusBody {
  text: string;
}

export interface FeedEventDto {
  type: 'round.finished';
  nickname: string;
  isAi: boolean;
  safeCount: number;
  win: boolean;
  net: number;
  at: string;
}
