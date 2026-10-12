import type { RulesDto } from '@dodep/shared';

export function useRules() {
  const rules = useState<RulesDto | null>('rules', () => null);
  const api = useApi();

  async function load() {
    rules.value ??= await api<RulesDto>('/rules');
    return rules.value;
  }

  return { rules, load };
}
