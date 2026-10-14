import { deepseek } from '@ai-sdk/deepseek';
import { generateText, Output } from 'ai';
import PQueue from 'p-queue';
import { decisionSchema, type AgentState } from './decision.schema.js';

const commonRules = `Ты играешь в Mines: поле 5×5, в каждом раунде 5 скрытых мин.
Ставка списывается при начале раунда. Безопасная клетка увеличивает потенциальную выплату;
мина завершает раунд без выплаты. После одной или нескольких безопасных клеток можно забрать выплату.
Теоретический RTP равен 97,3%, прошлые исходы не влияют на новое поле.
Действуй только из allowedActions и соблюдай текущие minBet, betStep, баланс и открытые клетки.
Правила игры и ограничения состояния имеют высший приоритет, затем обязательная стратегия типажа.
Характер и эмоции влияют на текст reason, но не позволяют нарушать обязательную стратегию.
allowedActions — доступные по правилам игры действия, а не рекомендация: наличие stop не означает,
что нужно остановиться. Выбирай stop только при условии остановки, явно предусмотренном типажом,
или если между раундами невозможно сделать допустимую ставку. Не придумывай новые цели и пороги.
Используй текущее состояние: balance — доступный банк сейчас, а не баланс из прошлого раунда.
Допустимая ставка: целое amount >= rule.minBet, amount <= balance, amount кратно rule.betStep.
Минимальная допустимая ставка: ceil(rule.minBet / rule.betStep) * rule.betStep;
максимальная: floor(balance / rule.betStep) * rule.betStep. Если минимум не больше максимума,
ставка возможна: остаток банка, не кратный шагу, не мешает поставить допустимую сумму.
Если activeRound существует, ставка уже списана: даже balance ниже minBet не повод остановиться.
Продолжай активный раунд по стратегии, используя activeRound.safeCount и activeRound.opened;
для open выбирай индекс 0..24, которого нет в opened. Скрытое расположение мин неизвестно.
Если типаж задаёт число безопасных клеток, до этой цели выбирай open, при её достижении — cash_out,
при условии доступности этих действий. Не считай прошлые раунды текущим активным раундом.
Если activeRound отсутствует, проверь условие stop типажа; иначе выбирай bet по его стратегии.
Лимиты запуска и нехватку банка API и runner проверяют отдельно; не предсказывай их наступление.
reason должен соответствовать числам текущего состояния и выбранному действию.
Ответь ТОЛЬКО одним JSON объектом: {"action":"bet","amount":100,"reason":"..."},
{"action":"open","cell":7,"reason":"..."}, {"action":"cash_out","reason":"..."}
или {"action":"stop","reason":"..."}. reason — короткое объяснение по-русски, до 240 символов.`;

export class ModelClient {
  private readonly queue: PQueue;

  constructor(
    private readonly modelId: string,
    concurrency: number,
  ) {
    this.queue = new PQueue({ concurrency });
  }

  decide(instructions: string, state: AgentState, feedback?: string) {
    return this.queue.add(async () => {
      const result = await generateText({
        model: deepseek(this.modelId),
        system: `${commonRules}\n\nСтратегия и характер типажа:\n${instructions}`,
        prompt: `${JSON.stringify(state)}${feedback ? `\n\nПредыдущее решение недопустимо: ${feedback} Исправь действие в новом JSON.` : ''}`,
        output: Output.object({ schema: decisionSchema }),
        providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
        maxOutputTokens: 256,
        maxRetries: 2,
      });
      return {
        decision: decisionSchema.parse(result.output),
        modelId: result.response.modelId ?? this.modelId,
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
      };
    });
  }
}
