import type { MeDto } from '@dodep/shared';

export function useMe() {
  const me = useState<MeDto | null>('me', () => null);
  const api = useApi();

  async function refresh() {
    try {
      me.value = await api<MeDto>('/me');
    } catch (e) {
      if (e instanceof ApiFetchError && e.status === 401) me.value = null;
      else throw e;
    }
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    me.value = null;
  }

  return { me, refresh, logout, isAuthed: computed(() => me.value !== null) };
}
