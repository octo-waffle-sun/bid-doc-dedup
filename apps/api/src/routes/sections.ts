import type { FastifyInstance } from 'fastify'
import { getSection, listSectionDocs, listSections } from '../repositories/sections.js'

export const registerSectionRoutes = async (app: FastifyInstance) => {
  app.get('/api/sections', async () => listSections())

  app.get('/api/sections/:sectionId', async (request) => {
    const { sectionId } = request.params as { sectionId: string }
    const section = await getSection(sectionId)
    if (!section) {
      return { status: 'NOT_FOUND' }
    }
    return section
  })

  app.get('/api/sections/:sectionId/docs', async (request) => {
    const { sectionId } = request.params as { sectionId: string }
    return listSectionDocs(sectionId)
  })
}
