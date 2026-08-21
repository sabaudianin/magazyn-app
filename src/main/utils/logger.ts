import log from 'electron-log/main'

// Domyślnie loguje też do pliku (userData/logs/main.log) — jedyny sposób, żeby błędy kroków
// PDF/Excel (zadanie 10) były diagnozowalne w spakowanej appce, bez podpiętych devtools.
log.initialize()

export const logger = log
