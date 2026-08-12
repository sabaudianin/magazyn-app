export const IPC_CHANNELS = {
  app: {
    ping: 'app:ping'
  },
  kontrahenci: {
    list: 'kontrahenci:list',
    get: 'kontrahenci:get',
    create: 'kontrahenci:create',
    update: 'kontrahenci:update',
    deactivate: 'kontrahenci:deactivate'
  },
  dokumenty: {
    create: 'dokumenty:create'
  }
} as const
