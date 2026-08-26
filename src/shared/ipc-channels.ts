export const IPC_CHANNELS = {
  app: {
    getVersion: 'app:getVersion'
  },
  kontrahenci: {
    list: 'kontrahenci:list',
    get: 'kontrahenci:get',
    create: 'kontrahenci:create',
    update: 'kontrahenci:update',
    deactivate: 'kontrahenci:deactivate'
  },
  dokumenty: {
    create: 'dokumenty:create',
    retryPdfKarta: 'dokumenty:retryPdfKarta',
    retryPdfCmr: 'dokumenty:retryPdfCmr',
    retryExcel: 'dokumenty:retryExcel',
    list: 'dokumenty:list',
    getById: 'dokumenty:getById'
  },
  pdf: {
    open: 'pdf:open',
    saveAs: 'pdf:saveAs'
  },
  stanMagazynowy: {
    list: 'stanMagazynowy:list'
  }
} as const
