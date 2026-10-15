import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../auth.schemas.js';

const payload = { password: 'password123', agree: true };

describe('registerSchema nickname', () => {
  it.each(['abc', 'Player_123', '123', '___', 'a'.repeat(20)])('accepts %s', (nickname) => {
    expect(registerSchema.safeParse({ ...payload, nickname }).success).toBe(true);
  });

  it.each(['игрок', 'playerЯ', 'café', '玩家名字', '１２３', 'ab-c', 'a.b', 'a b', 'ab', 'a'.repeat(21)])(
    'rejects %s',
    (nickname) => {
      expect(registerSchema.safeParse({ ...payload, nickname }).success).toBe(false);
    },
  );

  it('keeps trimming surrounding whitespace', () => {
    expect(registerSchema.parse({ ...payload, nickname: ' Player_123 ' }).nickname).toBe('Player_123');
  });
});

describe('loginSchema nickname', () => {
  it('allows existing accounts with Cyrillic nicknames to log in', () => {
    expect(loginSchema.safeParse({ nickname: 'игрок', password: payload.password }).success).toBe(true);
  });
});
