import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { createDoc } from '../repositories/sections.js'
import { ensureStorageRoot, hasDocFile, streamDocFile } from '../storage.js'

export const registerFileRoutes = async (app: FastifyInstance) => {
  app.post('/api/files/upload', async (request) => {
    const schema = z.object({
      section_id: z.string(),
      bidder: z.string(),
      filename: z.string(),
      file_type: z.string(),
      scanned: z.boolean().optional()
    })
    const payload = schema.parse(request.body)
    const doc = await createDoc({
      sectionId: payload.section_id,
      bidder: payload.bidder,
      filename: payload.filename,
      fileType: payload.file_type,
      scanned: payload.scanned ?? false,
      status: payload.scanned ? '待OCR' : '待解析',
      uploadedAt: new Date().toISOString()
    })
    return { doc_id: doc.id, version_id: `ver-${Date.now()}` }
  })

  app.get('/api/files/:docId/preview', async (request, reply) => {
    const { docId } = request.params as { docId: string }
    const doc = await prisma.doc.findUnique({ where: { id: docId } })
    if (!doc) {
      reply.code(404)
      return { status: 'NOT_FOUND' }
    }
    ensureStorageRoot()
    if (!hasDocFile(docId)) {
      reply.code(404)
      return { status: 'FILE_NOT_FOUND' }
    }
    reply.type('application/pdf')
    return reply.send(streamDocFile(docId))
  })

  app.get('/api/docs/:docId/pages/:pageNo', async (request) => {
    const { docId, pageNo } = request.params as { docId: string; pageNo: string }
    return {
      doc_id: docId,
      page_no: Number(pageNo),
      width: 1200,
      height: 1697,
      has_text_layer: true
    }
  })
}
