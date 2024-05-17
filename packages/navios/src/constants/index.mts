import type { HttpMethod } from '../types.mjs'

export const RequestsWithoutBody = ['GET', 'HEAD', 'OPTIONS', 'DELETE'] as const
export type RequestsWithoutBody = (typeof RequestsWithoutBody)[number]
export type RequestsWithBody = Exclude<HttpMethod, RequestsWithoutBody>
export const RequestsWithBody = ['POST', 'PUT', 'PATCH'] as const
