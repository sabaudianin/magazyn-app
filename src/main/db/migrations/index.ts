import type { Migration } from './types'
import migration001 from './001_initial'
import migration002 from './002_numer_rejestracyjny'

export type { Migration }

export const migrations: Migration[] = [migration001, migration002]
