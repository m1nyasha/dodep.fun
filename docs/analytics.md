# Аналитика

Все запросы — для MySQL 8.4, выполняются как есть (`mysql … dodep < query.sql` или в любом клиенте). id хранятся в `BINARY(16)`: для вывода — `BIN_TO_UUID(id)`, для фильтра — `UUID_TO_BIN('…')`.

## Источники

| Таблица / view  | Что в ней                                                                                                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v_rounds`      | завершённые раунды + `nickname`, `is_ai`, `ai_type`, `bet_share` (ставка / баланс до), `net`, `duration_ms`, `prev_status`, `prev_bet`, `prev_safe_count` (предыдущий раунд игрока)                               |
| `round_actions` | каждый клик и cash-out: `seq`, `type`, `cell`, `result`, `safe_before`, `multiplier` и `potential_payout` **на момент решения** (до результата)                                                                   |
| `ledger`        | каждое изменение баланса: `kind` (`signup`, `bet`, `payout`, `daily`, `admin`), `amount`, `balance_before`, `balance_after`. `admin` — ручная правка баланса из админки, не игровой доход: исключайте её из `net` |
| `users`         | текущий `balance`, суммы `total_wagered`, `total_payout`, `rounds_count`                                                                                                                                          |
| `admin_actions` | действия администратора: `action` (в т.ч. `coins_adjust` — ручное начисление/списание монет), `target_user_id`, `payload`, `reason`                                                                               |

## Фильтры

Во всех запросах ниже по `v_rounds` стоит `WHERE is_ai = 0` (люди). Замены:

- AI: `is_ai = 1`, по типажу — `AND ai_type = 'Рисковый'`;
- последний эксперимент: в начале скрипта `SET @experiment = (SELECT id FROM experiments ORDER BY started_at DESC LIMIT 1);` и условие `experiment_id = @experiment`;
- период: `AND finished_at >= '2026-11-01' AND finished_at < '2026-12-01'` (UTC).

## Главные метрики

Раунды, поставлено, выплачено, фактический RTP:

```sql
SELECT COUNT(*) AS rounds, SUM(bet) AS wagered, SUM(payout) AS payout, SUM(payout) / SUM(bet) AS realized_rtp
FROM v_rounds
WHERE is_ai = 0;
```

Деньги игроков сейчас:

```sql
SELECT SUM(balance) AS total_player_money, COUNT(*) AS accounts
FROM users
WHERE is_ai = 0 AND blocked_at IS NULL;
```

Деньги игроков по дням (баланс каждого аккаунта на конец дня по `ledger`):

```sql
WITH days AS (SELECT DISTINCT DATE(created_at) AS d FROM ledger),
last_entry AS (
  SELECT days.d, l.user_id, l.balance_after,
         ROW_NUMBER() OVER (PARTITION BY days.d, l.user_id ORDER BY l.created_at DESC, l.id DESC) AS rn
  FROM days
  JOIN ledger l ON l.created_at < days.d + INTERVAL 1 DAY
)
SELECT le.d AS day, SUM(le.balance_after) AS total_player_money
FROM last_entry le
JOIN users u ON u.id = le.user_id
WHERE le.rn = 1 AND u.is_ai = 0
GROUP BY le.d
ORDER BY le.d;
```

Средняя глубина cash-out:

```sql
SELECT AVG(safe_count) AS avg_cash_out_depth
FROM v_rounds
WHERE is_ai = 0 AND status = 'cashed_out';
```

Доля банкротств — доля сыгравших аккаунтов, у которых хотя бы раз после раунда баланс опускался ниже минимальной ставки:

```sql
SELECT COUNT(DISTINCT CASE WHEN r.balance_after < rv.min_bet THEN r.user_id END) / COUNT(DISTINCT r.user_id) AS bankruptcy_rate
FROM rounds r
JOIN rule_versions rv ON rv.id = r.rule_version_id
JOIN users u ON u.id = r.user_id
WHERE r.status <> 'active' AND u.is_ai = 0;
```

Доля игроков в плюсе по ставкам (ежедневные монеты не учитываются):

```sql
SELECT AVG(total_payout > total_wagered) AS profitable_share, COUNT(*) AS accounts
FROM users
WHERE is_ai = 0 AND rounds_count > 0;
```

## Поведение

Частота мин по глубине против теории `5 / (25 − k)`:

```sql
SELECT safe_before AS depth, COUNT(*) AS clicks, AVG(result = 'mine') AS mine_rate, 5 / (25 - safe_before) AS expected
FROM round_actions
WHERE type = 'open'
GROUP BY safe_before
ORDER BY safe_before;
```

Реакция на предыдущий раунд — ставка и глубина после победы и после мины:

```sql
SELECT prev_status, COUNT(*) AS rounds, AVG(bet / prev_bet) AS bet_ratio, AVG(bet_share) AS avg_bet_share,
       AVG(safe_count) AS avg_depth, AVG(prev_safe_count) AS avg_prev_depth
FROM v_rounds
WHERE is_ai = 0 AND prev_status IS NOT NULL
GROUP BY prev_status;
```

Карта кликов 5×5 (первый клик раунда; уберите `ra.seq = 1`, чтобы считать все):

```sql
SELECT ra.cell DIV 5 AS row_no, ra.cell MOD 5 AS col_no, COUNT(*) AS clicks
FROM round_actions ra
JOIN rounds r ON r.id = ra.round_id
JOIN users u ON u.id = r.user_id
WHERE ra.type = 'open' AND ra.seq = 1 AND u.is_ai = 0
GROUP BY ra.cell
ORDER BY ra.cell;
```

Упущенный cash-out — сколько можно было забрать перед кликом на мину:

```sql
SELECT u.nickname, u.is_ai, r.bet, ra.safe_before AS depth, ra.potential_payout AS missed_payout, r.finished_at
FROM round_actions ra
JOIN rounds r ON r.id = ra.round_id
JOIN users u ON u.id = r.user_id
WHERE ra.result = 'mine' AND ra.safe_before > 0
ORDER BY ra.potential_payout DESC
LIMIT 20;
```

Время на решение по глубине (для первого действия — от старта раунда):

```sql
SELECT t.safe_before AS depth, COUNT(*) AS decisions, AVG(t.ms) AS avg_ms
FROM (
  SELECT ra.safe_before,
         TIMESTAMPDIFF(
           MICROSECOND,
           COALESCE(LAG(ra.created_at) OVER (PARTITION BY ra.round_id ORDER BY ra.seq), r.started_at),
           ra.created_at
         ) / 1000 AS ms
  FROM round_actions ra
  JOIN rounds r ON r.id = ra.round_id
  JOIN users u ON u.id = r.user_id
  WHERE u.is_ai = 0
) t
GROUP BY t.safe_before
ORDER BY t.safe_before;
```

Ежедневная выдача после проигрыша всех монет — игровой аналог «додепа»:

```sql
SELECT COUNT(*) AS claims, AVG(l.balance_before < rv.min_bet) AS share_after_bankruptcy
FROM ledger l
JOIN rule_versions rv ON rv.is_active
WHERE l.kind = 'daily';
```
