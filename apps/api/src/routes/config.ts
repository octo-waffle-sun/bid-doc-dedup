import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createPrompt, createProvider, listPrompts, listProviders, listRules } from '../repositories/config.js'
import { createInvokeLog } from '../repositories/audit.js'

export const registerConfigRoutes = async (app: FastifyInstance) => {
  app.get('/api/config/llm-providers', async () => listProviders())

  app.post('/api/config/llm-providers', async (request) => {
    const schema = z.object({
      type: z.string(),
      name: z.string(),
      base_url: z.string().optional(),
      model: z.string().optional(),
      qps: z.number().optional(),
      enabled: z.boolean().optional(),
      api_key: z.string().optional()
    })
    const payload = schema.parse(request.body)
    await createProvider({
      type: payload.type,
      name: payload.name,
      model: payload.model,
      qps: payload.qps,
      enabled: payload.enabled,
      baseUrl: payload.base_url,
      apiKey: payload.api_key
    })
    return { status: 'OK' }
  })

  app.get('/api/config/prompts', async () => listPrompts())

  app.post('/api/config/prompts', async (request) => {
    const schema = z.object({
      prompt_version: z.string(),
      type: z.string(),
      template_text: z.string()
    })
    const payload = schema.parse(request.body)
    await createPrompt({
      promptVersion: payload.prompt_version,
      type: payload.type,
      content: payload.template_text
    })
    return { status: 'OK' }
  })

  app.get('/api/config/rules', async () => listRules())

  app.post('/api/config/test-invoke', async () => {
    await createInvokeLog({
      stage: 'TEST',
      status: 'OK',
      latencyMs: 1200
    })
    return { status: 'OK' }
  })
}
