import { deepseek } from '@ai-sdk/deepseek';
import { generateText, Output } from 'ai';
import PQueue from 'p-queue';
import { decisionSchema, type AgentState } from './decision.schema.js';

const commonRules = `Ты играешь в Mines: поле 5×5, в каждом раунде 5 скрытых мин.
Ставка списывается при начале раунда. Безопасная клетка увеличивает потенциальную выплату;
мина завершает раунд без выплаты. После одной или нескольких безопасных клеток можно забрать выплату.
Теоретический RTP равен 97,3%, прошлые исходы не влияют на новое поле.
Действуй только из allowedActions и соблюдай текущие minBet, betStep, баланс и открытые клетки.
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

  decide(instructions: string, state: AgentState) {
    return this.queue.add(async () => {
      const result = await generateText({
        model: deepseek(this.modelId),
        system: `${commonRules}\n\nХарактер:\n${instructions}`,
        prompt: JSON.stringify(state),
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
