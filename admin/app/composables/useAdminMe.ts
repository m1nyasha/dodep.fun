import type { AdminMeDto } from '@dodep/shared';

export const useAdminMe = () => useState<AdminMeDto | null>('admin-me', () => null);
