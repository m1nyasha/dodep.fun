import type { AdminActionKind } from '@dodep/shared';

const LABELS: Record<AdminActionKind, string> = {
  block: 'Заблокировать',
  unblock: 'Разблокировать',
  hide_status: 'Скрыть статус',
  show_status: 'Показать статус',
  rules_create: 'Новая версия правил',
  rules_activate: 'Активировать правила',
  settings_update: 'Лимит регистраций',
  coins_adjust: 'Начислить/списать монеты',
};

export const actionLabel = (action: AdminActionKind) => LABELS[action];
