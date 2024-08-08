import { declareAPI } from '@navios/navios-zod'

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { makeInfiniteQueryOptions } from '../makeInfiniteQueryOptions.mjs'

describe('makeInfiniteQueryOptions', () => {
  const api = declareAPI({})
  const responseSchema = z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), test: z.string() }),
    z.object({ success: z.literal(false), message: z.string() }),
  ])
  const endpoint = api.declareEndpoint({
    method: 'GET',
    url: '/test/$testId/foo/$fooId' as const,
    querySchema: z.object({ testId: z.string(), fooId: z.string() }),
    responseSchema,
  })
  it('should work with types', () => {
    const makeOptions = makeInfiniteQueryOptions(
      endpoint,
      {
        getNextPageParam: (lastPage) => ({ testId: '1', fooId: '2' }),
        processResponse: (data) => {
          if (!data.success) {
            throw new Error(data.message)
          }
          return data
        },
      },
      {
        select: (data) => data.pages.map((page) => page.test).flat(),
      },
    )
    const options = makeOptions({
      urlParams: { testId: '1', fooId: '2' },
    })
    expect(options).toBeDefined()
  })
})
