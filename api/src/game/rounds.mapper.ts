import { multiplier, payout, type FinishedRoundDto, type RoundDto } from '@dodep/shared';
import type { RoundActionRow, RoundRow, RuleRow } from '../db/schema.js';

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

export function openedCells(actions: RoundActionRow[]): number[] {
  return actions
    .filter((a) => a.type === 'open' && a.result === 'safe')
    .map((a) => required(a.cell, `open action ${a.id} missing cell`));
}

export function toRoundDto(round: RoundRow, actions: RoundActionRow[], rule: RuleRow): RoundDto {
  const base = {
    id: round.id,
    roundNo: round.roundNo,
    bet: round.bet,
    hash: round.hash,
    ruleVersion: rule.version,
    rtp: rule.rtp,
    opened: openedCells(actions),
    safeCount: round.safeCount,
    startedAt: round.startedAt.toISOString(),
  };
  if (round.status === 'active') {
    return {
      ...base,
      status: 'active',
      multiplier: multiplier(round.safeCount, rule.rtp),
      potentialPayout: payout(round.bet, round.safeCount, rule.rtp),
    };
  }
  return {
    ...base,
    status: round.status,
    endReason: required(round.endReason, `finished round ${round.id} missing endReason`),
    multiplier: round.multiplier ?? 0,
    payout: round.payout,
    net: round.payout - round.bet,
    hitCell: round.hitCell,
    mines: round.mines,
    salt: round.salt,
    finishedAt: required(round.finishedAt, `finished round ${round.id} missing finishedAt`).toISOString(),
  } satisfies FinishedRoundDto;
}
