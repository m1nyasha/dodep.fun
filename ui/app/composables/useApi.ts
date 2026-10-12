import { toApiFetchError } from '../utils/api-error';

export function useApi() {
  const config = useRuntimeConfig();
  const server = import.meta.server;
  return $fetch.create({
    baseURL: server ? `${config.apiInternalUrl || 'http://localhost:4200'}/api` : '/api',
    headers: server ? useRequestHeaders(['cookie']) : undefined,
    onResponseError({ response }) {
      throw toApiFetchError(response.status, response._data);
    },
  });
}
