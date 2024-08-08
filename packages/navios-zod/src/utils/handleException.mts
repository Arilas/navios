import type { ZodDiscriminatedUnion } from 'zod'

import { NaviosError } from 'navios'

import { ZodObject } from 'zod'

import type {  DeclareAPIConfig } from '../types.mjs'


export function handleException(
  config: DeclareAPIConfig,
  error: unknown,
  responseSchema: ZodObject<any, any, any> | ZodDiscriminatedUnion<any, any>,
) {
  if (!config.useDiscriminatorResponse) {
    throw error
  }
  if (error instanceof NaviosError && error.response) {
    if (config.useWholeResponse) {
      return responseSchema.parse(error.response)
    }
    return responseSchema.parse(error.response.data)
  }
  throw error
}
