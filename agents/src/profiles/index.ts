export interface Profile {
  key: string;
  title: string;
  instructionsFile: string;
}

export const profiles: Profile[] = [
  { key: 'loss-chaser', title: 'Отыгрывающийся', instructionsFile: 'loss-chaser.md' },
];
