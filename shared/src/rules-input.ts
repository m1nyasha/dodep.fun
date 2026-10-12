import type { RuleVersionFields } from './admin-dto.js';

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;

export function ruleInputErrors(input: RuleVersionFields): Partial<Record<keyof RuleVersionFields, string>> {
  const errors: Partial<Record<keyof RuleVersionFields, string>> = {};
  const rtpMicros = input.rtp * 1e6;
  if (!(input.rtp >= 0.5 && input.rtp <= 1) || Math.abs(rtpMicros - Math.round(rtpMicros)) > 1e-6)
    errors.rtp = 'RTP — от 0,5 до 1, не больше 6 знаков после запятой';
  if (!isPositiveInt(input.betStep)) errors.betStep = 'Шаг — целое число больше нуля';
  if (!isPositiveInt(input.minBet)) errors.minBet = 'Минимальная ставка — целое число больше нуля';
  else if (isPositiveInt(input.betStep) && input.minBet % input.betStep !== 0)
    errors.minBet = 'Минимальная ставка должна быть кратна шагу';
  if (!isPositiveInt(input.startBalance)) errors.startBalance = 'Стартовый баланс — целое число больше нуля';
  else if (isPositiveInt(input.minBet) && input.startBalance < input.minBet)
    errors.startBalance = 'Стартового баланса должно хватать на минимальную ставку';
  if (!Number.isInteger(input.dailyTarget) || input.dailyTarget < 0)
    errors.dailyTarget = 'Ежедневная выдача — целое число не меньше нуля';
  return errors;
}
