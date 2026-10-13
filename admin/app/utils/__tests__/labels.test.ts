import { describe, expect, it } from 'vitest';
import { actionLabel } from '../labels';

describe('actionLabel', () => {
  it('names every admin action in Russian', () => {
    expect(actionLabel('block')).toBe('Заблокировать');
    expect(actionLabel('unblock')).toBe('Разблокировать');
    expect(actionLabel('hide_status')).toBe('Скрыть статус');
    expect(actionLabel('show_status')).toBe('Показать статус');
    expect(actionLabel('rules_create')).toBe('Новая версия правил');
    expect(actionLabel('rules_activate')).toBe('Активировать правила');
    expect(actionLabel('settings_update')).toBe('Лимит регистраций');
    expect(actionLabel('coins_adjust')).toBe('Начислить/списать монеты');
  });
});
