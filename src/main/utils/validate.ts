import type { ZodType } from 'zod'
import { AppError } from './errors'

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new AppError('VALIDATION', result.error.issues.map((issue) => issue.message).join('; '))
  }
  return result.data
}
