export interface Profile {
  key: string;
  title: string;
  instructionsFile: string;
}

export const profiles: Profile[] = [
  { key: 'one-click', title: 'Один клик', instructionsFile: 'one-click.md' },
  { key: 'deep-diver', title: 'Глубоководный', instructionsFile: 'deep-diver.md' },
  { key: 'flat-bettor', title: 'Ровная ставка', instructionsFile: 'flat-bettor.md' },
  { key: 'all-in', title: 'Ва-банк', instructionsFile: 'all-in.md' },
  { key: 'stop-loss', title: 'Стоп-лосс', instructionsFile: 'stop-loss.md' },
  { key: 'take-profit', title: 'Зафиксировать прибыль', instructionsFile: 'take-profit.md' },
  { key: 'loss-chaser', title: 'Отыгрывающийся', instructionsFile: 'loss-chaser.md' },
  { key: 'win-presser', title: 'На волне удачи', instructionsFile: 'win-presser.md' },
  { key: 'pattern-believer', title: 'Искатель паттернов', instructionsFile: 'pattern-believer.md' },
  { key: 'skeptic', title: 'Скептик', instructionsFile: 'skeptic.md' },
];
