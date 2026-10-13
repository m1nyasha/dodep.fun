import { sql } from 'drizzle-orm';
import {
  bigint,
  binary,
  boolean,
  customType,
  datetime,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { parse, stringify, v7 } from 'uuid';

export const uuid = customType<{ data: string; driverData: Buffer }>({
  dataType: () => 'binary(16)',
  toDriver: (value) => Buffer.from(parse(value)),
  fromDriver: (value) => stringify(new Uint8Array(value)),
});

export const newId = () => v7();

const id = () => uuid('id').primaryKey().$defaultFn(newId);
const ts = (name: string) => datetime(name, { mode: 'date', fsp: 3 });
const createdAt = () =>
  ts('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);
const money = (name: string) => bigint(name, { mode: 'number' });
const rate = (name: string) => decimal(name, { precision: 14, scale: 6, mode: 'number' });

export const users = mysqlTable(
  'users',
  {
    id: id(),
    nickname: varchar('nickname', { length: 20 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    isAdmin: boolean('is_admin').notNull().default(false),
    isAi: boolean('is_ai').notNull().default(false),
    aiType: varchar('ai_type', { length: 40 }),
    balance: money('balance').notNull(),
    totalWagered: money('total_wagered').notNull().default(0),
    totalPayout: money('total_payout').notNull().default(0),
    roundsCount: int('rounds_count').notNull().default(0),
    statusText: varchar('status_text', { length: 72 }),
    statusUpdatedAt: ts('status_updated_at'),
    statusHiddenAt: ts('status_hidden_at'),
    blockedAt: ts('blocked_at'),
    blockReason: varchar('block_reason', { length: 255 }),
    lastDailyAt: ts('last_daily_at'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_nickname_uq').on(t.nickname), index('users_balance_idx').on(t.balance)],
);

export type UserRow = typeof users.$inferSelect;

export const sessions = mysqlTable(
  'sessions',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: mysqlEnum('kind', ['user', 'admin', 'admin_ticket']).notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: ts('expires_at').notNull(),
    usedAt: ts('used_at'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('sessions_token_uq').on(t.tokenHash), index('sessions_user_idx').on(t.userId)],
);

export const ruleVersions = mysqlTable(
  'rule_versions',
  {
    id: id(),
    version: int('version').notNull(),
    rtp: decimal('rtp', { precision: 7, scale: 6, mode: 'number' }).notNull(),
    minBet: money('min_bet').notNull(),
    betStep: money('bet_step').notNull(),
    startBalance: money('start_balance').notNull(),
    dailyTarget: money('daily_target').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    activeFlag: tinyint('active_flag').generatedAlwaysAs(sql`if(is_active, 1, null)`, { mode: 'stored' }),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('rule_versions_version_uq').on(t.version),
    uniqueIndex('rule_versions_active_uq').on(t.activeFlag),
  ],
);

export type RuleRow = typeof ruleVersions.$inferSelect;

export const experiments = mysqlTable('experiments', {
  id: id(),
  name: varchar('name', { length: 120 }).notNull(),
  ruleVersionId: uuid('rule_version_id')
    .notNull()
    .references(() => ruleVersions.id),
  startedAt: ts('started_at').notNull(),
  finishedAt: ts('finished_at'),
});

export const rounds = mysqlTable(
  'rounds',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    ruleVersionId: uuid('rule_version_id')
      .notNull()
      .references(() => ruleVersions.id),
    experimentId: uuid('experiment_id').references(() => experiments.id),
    roundNo: int('round_no').notNull(),
    client: mysqlEnum('client', ['web', 'agent']).notNull().default('web'),
    randomSource: mysqlEnum('random_source', ['SYSTEM_CSPRNG']).notNull().default('SYSTEM_CSPRNG'),
    bet: money('bet').notNull(),
    balanceBefore: money('balance_before').notNull(),
    balanceAfter: money('balance_after'),
    status: mysqlEnum('status', ['active', 'cashed_out', 'hit_mine']).notNull().default('active'),
    endReason: mysqlEnum('end_reason', ['mine', 'cash_out', 'all_safe']),
    safeCount: int('safe_count').notNull().default(0),
    multiplier: rate('multiplier'),
    payout: money('payout').notNull().default(0),
    mines: json('mines').$type<number[]>().notNull(),
    salt: varchar('salt', { length: 32 }).notNull(),
    hash: varchar('hash', { length: 64 }).notNull(),
    hitCell: tinyint('hit_cell'),
    startedAt: ts('started_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    finishedAt: ts('finished_at'),
    activeUserId: binary('active_user_id', { length: 16 }).generatedAlwaysAs(
      sql`if(status = 'active', user_id, null)`,
      { mode: 'stored' },
    ),
  },
  (t) => [
    uniqueIndex('rounds_active_user_uq').on(t.activeUserId),
    uniqueIndex('rounds_user_no_uq').on(t.userId, t.roundNo),
    index('rounds_experiment_idx').on(t.experimentId),
    index('rounds_finished_idx').on(t.finishedAt),
  ],
);

export type RoundRow = typeof rounds.$inferSelect;

// multiplier/potential_payout — то, что игрок мог забрать в момент решения, до результата действия.
export const roundActions = mysqlTable(
  'round_actions',
  {
    id: id(),
    roundId: uuid('round_id')
      .notNull()
      .references(() => rounds.id, { onDelete: 'cascade' }),
    seq: int('seq').notNull(),
    type: mysqlEnum('type', ['open', 'cash_out']).notNull(),
    cell: tinyint('cell'),
    result: mysqlEnum('result', ['safe', 'mine']),
    safeBefore: int('safe_before').notNull(),
    multiplier: rate('multiplier').notNull(),
    potentialPayout: money('potential_payout').notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('round_actions_seq_uq').on(t.roundId, t.seq), index('round_actions_cell_idx').on(t.cell)],
);

export type RoundActionRow = typeof roundActions.$inferSelect;

export const ledger = mysqlTable(
  'ledger',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    kind: mysqlEnum('kind', ['signup', 'bet', 'payout', 'daily', 'admin']).notNull(),
    amount: money('amount').notNull(),
    balanceBefore: money('balance_before').notNull(),
    balanceAfter: money('balance_after').notNull(),
    roundId: uuid('round_id').references(() => rounds.id),
    createdAt: createdAt(),
  },
  (t) => [index('ledger_user_created_idx').on(t.userId, t.createdAt)],
);

export const authFingerprints = mysqlTable(
  'auth_fingerprints',
  {
    id: id(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    event: mysqlEnum('event', ['register', 'login', 'register_denied']).notNull(),
    ip: varchar('ip', { length: 45 }).notNull(),
    userAgent: varchar('user_agent', { length: 512 }).notNull(),
    acceptLanguage: varchar('accept_language', { length: 255 }).notNull(),
    clientHash: varchar('client_hash', { length: 64 }),
    createdAt: createdAt(),
  },
  (t) => [
    index('auth_fp_ip_event_idx').on(t.ip, t.event, t.createdAt),
    index('auth_fp_user_idx').on(t.userId),
    index('auth_fp_client_idx').on(t.clientHash),
  ],
);

export const settings = mysqlTable('settings', {
  key: varchar('key', { length: 64 }).primaryKey(),
  value: json('value').notNull(),
  updatedAt: ts('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});

export const statusHistory = mysqlTable(
  'status_history',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    text: varchar('text', { length: 72 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('status_history_user_idx').on(t.userId)],
);

export const adminActions = mysqlTable(
  'admin_actions',
  {
    id: id(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => users.id),
    action: mysqlEnum('action', [
      'block',
      'unblock',
      'hide_status',
      'show_status',
      'rules_create',
      'rules_activate',
      'settings_update',
      'coins_adjust',
    ]).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id),
    payload: json('payload'),
    reason: varchar('reason', { length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [index('admin_actions_created_idx').on(t.createdAt)],
);
