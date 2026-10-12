export const SERVICES = {
  api: { imageVar: 'IMAGE_API', fallback: 'dodep-api' },
  app: { imageVar: 'IMAGE_APP', fallback: 'dodep-app' },
  admin: { imageVar: 'IMAGE_ADMIN', fallback: 'dodep-admin' },
};

export function resolveServices(target = 'all') {
  if (target === 'all') return Object.keys(SERVICES);
  if (!(target in SERVICES)) throw new Error(`Unknown service "${target}". Use api, app, admin or all.`);
  return [target];
}

export const imageRef = (registry, image, tag) => `${registry ? `${registry}/` : ''}${image}:${tag}`;

export function dockerArgs({ command, service, env, tag }) {
  const { imageVar, fallback } = SERVICES[service];
  const ref = (t) => imageRef(env.REGISTRY ?? '', env[imageVar] || fallback, t);
  const buildArgs = { SENTRY_RELEASE: tag };
  if (service === 'admin') {
    if (env.ADMIN_SENTRY_DSN) buildArgs.NUXT_PUBLIC_SENTRY_DSN = env.ADMIN_SENTRY_DSN;
    if (env.SENTRY_ENVIRONMENT) buildArgs.NUXT_PUBLIC_SENTRY_ENVIRONMENT = env.SENTRY_ENVIRONMENT;
    if (env.ADMIN_SITE_URL) buildArgs.NUXT_PUBLIC_SITE_URL = env.ADMIN_SITE_URL;
  }
  const push = command === 'push';
  return [
    ...(push ? ['buildx', 'build'] : ['build']),
    '--platform',
    env.PLATFORM || 'linux/amd64',
    '-f',
    'docker/Dockerfile',
    '--target',
    service,
    '-t',
    ref(tag),
    '-t',
    ref('latest'),
    ...Object.entries(buildArgs).flatMap(([k, v]) => ['--build-arg', `${k}=${v}`]),
    ...(push ? ['--push'] : []),
    '.',
  ];
}
