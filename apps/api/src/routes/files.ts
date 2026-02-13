import type { FastifyInstance } from 'fastify'
import '@fastify/multipart'
import path from 'node:path'
import { z } from 'zod'
import { prisma } from '../db.js'
import { createDoc } from '../repositories/sections.js'
import { ensureStorageRoot, hasDocFile, saveDocFile, streamDocFile } from '../storage.js'

export const registerFileRoutes = async (app: FastifyInstance) => {
  app.post('/api/files/upload', async (request, reply) => {
    const isMultipart =
      typeof request.headers['content-type'] === 'string' &&
      request.headers['content-type'].includes('multipart/form-data')
    if (isMultipart) {
      const requestWithFile = request as typeof request & { file: () => Promise<any> }
      const part = await requestWithFile.file()
      if (!part) {
        reply.code(400)
        return { status: 'NO_FILE' }
      }
      const schema = z.object({
        section_id: z.string(),
        bidder: z.string(),
        scanned: z.coerce.boolean().optional(),
        file_type: z.string().optional(),
        filename: z.string().optional()
      })
      const fields = part.fields as Record<string, any>
      const payload = schema.parse({
        section_id: fields.section_id?.value ?? fields.section_id,
        bidder: fields.bidder?.value ?? fields.bidder,
        scanned: fields.scanned?.value ?? fields.scanned,
        file_type: fields.file_type?.value ?? fields.file_type,
        filename: fields.filename?.value ?? fields.filename
      })
      const filename = payload.filename ?? part.filename
      const ext = path.extname(filename).replace('.', '')
      const fileType = payload.file_type ?? (ext || 'pdf')
      const doc = await createDoc({
        sectionId: payload.section_id,
        bidder: payload.bidder,
        filename,
        fileType,
        scanned: payload.scanned ?? false,
        status: payload.scanned ? '待OCR' : '待解析',
        uploadedAt: new Date().toISOString()
      })
      const storagePath = await saveDocFile(doc.id, part.file)
      await prisma.doc.update({
        where: { id: doc.id },
        data: { storagePath }
      })
      return { doc_id: doc.id, version_id: `ver-${Date.now()}` }
    }
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
