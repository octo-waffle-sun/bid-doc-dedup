import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createSection,
  deleteSection,
  getSection,
  listSectionDocs,
  listSections,
  updateSection
} from '../repositories/sections.js'

export const registerSectionRoutes = async (app: FastifyInstance) => {
  app.get('/api/sections', async () => listSections())

  app.post('/api/sections', async (request) => {
    const schema = z.object({
      name: z.string(),
      code: z.string(),
      opened_at: z.string()
    })
    const payload = schema.parse(request.body)
    return createSection({ name: payload.name, code: payload.code, openedAt: payload.opened_at })
  })

  app.get('/api/sections/:sectionId', async (request) => {
    const { sectionId } = request.params as { sectionId: string }
    const section = await getSection(sectionId)
    if (!section) {
      return { status: 'NOT_FOUND' }
    }
    return section
  })

  app.patch('/api/sections/:sectionId', async (request) => {
    const { sectionId } = request.params as { sectionId: string }
    const schema = z
      .object({
        name: z.string().optional(),
        code: z.string().optional(),
        opened_at: z.string().optional()
      })
      .refine((value) => value.name || value.code || value.opened_at)
    const payload = schema.parse(request.body)
    return updateSection(sectionId, {
      name: payload.name,
      code: payload.code,
      openedAt: payload.opened_at
    })
  })

  app.delete('/api/sections/:sectionId', async (request, reply) => {
    const { sectionId } = request.params as { sectionId: string }
    const result = await deleteSection(sectionId)
    if (!result) {
      reply.code(404)
      return { status: 'NOT_FOUND' }
    }
    if (result.status === 'NOT_ALLOWED') {
      reply.code(409)
      return result
    }
    return result
  })

  app.get('/api/sections/:sectionId/docs', async (request) => {
    const { sectionId } = request.params as { sectionId: string }
    return listSectionDocs(sectionId)
  })
}
