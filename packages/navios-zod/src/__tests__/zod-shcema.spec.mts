import { describe, expect, it } from 'vitest'
import { makeNaviosFakeAdapter } from 'navios/testing'
import { createAPI } from '../index.mjs'
import { z } from 'zod'

describe('navios-zod', () => {
  it('should parse the response', async () => {
    const adapter = makeNaviosFakeAdapter()
    adapter.mock(
      '/api/test',
      'GET',
      () => new Response(JSON.stringify({ data: 'test' })),
    )
    const api = createAPI({ baseURL: '/api', adapter: adapter.fetch })
    const request = z.object({
      foo: z.string(),
      bar: z.coerce.number(),
    })
    const getTest = api.declareEndpoint(
      'GET',
      '/test',
      z.object({ data: z.string() }),
      request,
    )
    const result = await getTest({
      data: {
        foo: 'foo',
        bar: 42,
      },
    })
    expect(result).toEqual({ data: 'test' })
  })

  it('should work with descriminators', async () => {
    const adapter = makeNaviosFakeAdapter()
    let sentSuccess = false
    adapter.mock('/api/test', 'GET', () => {
      if (!sentSuccess) {
        sentSuccess = true
        return new Response(JSON.stringify({ content: 'test' }))
      }
      return new Response(JSON.stringify({ error: 'test' }), {
        status: 400,
      })
    })
    const api = createAPI({
      baseURL: '/api',
      adapter: adapter.fetch,
      useDiscriminatorResponse: true,
      useWholeResponse: true,
    })
    const request = z.object({
      foo: z.string(),
      bar: z.coerce.number(),
    })
    const descrimintatedSchema = z.discriminatedUnion('status', [
      z.object({
        status: z.literal(200),
        data: z.object({
          content: z.string(),
        }),
      }),
      z.object({
        status: z.literal(400),
        data: z.object({
          error: z.string(),
        }),
      }),
    ])
    const getTest = api.declareEndpoint(
      'GET',
      '/test',
      descrimintatedSchema,
      request,
    )
    const result = await getTest({
      data: {
        foo: 'foo',
        bar: 42,
      },
    })
    expect(result).toEqual({
      status: 200,
      data: { content: 'test' },
    })
    const result2 = await getTest({
      data: {
        foo: 'foo',
        bar: 42,
      },
    })
    expect(result2).toEqual({ status: 400, data: { error: 'test' } })
  })
})
