export function useAuthModal() {
  const state = useState('auth-modal', () => ({ open: false, mode: 'register' as 'login' | 'register' }));
  return {
    state,
    open(mode: 'login' | 'register' = 'register') {
      state.value = { open: true, mode };
    },
    close() {
      state.value = { ...state.value, open: false };
    },
  };
}
