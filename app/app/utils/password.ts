export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0;
  const score =
    Number(password.length >= 8) +
    Number(password.length >= 12) +
    Number(/[a-zа-яё]/.test(password) && /[A-ZА-ЯЁ]/.test(password)) +
    Number(/\d/.test(password) && /[^\p{L}\p{N}]/u.test(password));
  return Math.max(1, score) as 1 | 2 | 3 | 4;
}
