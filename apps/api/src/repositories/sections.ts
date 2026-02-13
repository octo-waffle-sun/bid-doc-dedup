import { prisma } from '../db.js'

export const listSections = async () => {
  const sections = await prisma.section.findMany()
  const docCounts = await prisma.doc.groupBy({
    by: ['sectionId'],
    _count: { sectionId: true }
  })
  const map = new Map<string, number>(
    docCounts.map((item: { sectionId: string; _count: { sectionId: number } }) => [
      item.sectionId,
      item._count.sectionId
    ])
  )
  return sections.map((section: { id: string; name: string; code: string; openedAt: string }) => ({
    section_id: section.id,
    name: section.name,
    code: section.code,
    opened_at: section.openedAt,
    bidder_count: map.get(section.id) ?? 0
  }))
}

export const getSection = async (sectionId: string) => {
  const section = await prisma.section.findUnique({ where: { id: sectionId } })
  if (!section) return null
  const docCount = await prisma.doc.count({ where: { sectionId } })
  return {
    section_id: section.id,
    name: section.name,
    code: section.code,
    opened_at: section.openedAt,
    doc_count: docCount
  }
}

export const listSectionDocs = async (sectionId: string) => {
  const docs = await prisma.doc.findMany({ where: { sectionId } })
  return docs.map(
    (doc: {
      id: string
      bidder: string
      filename: string
      fileType: string
      scanned: boolean
      status: string
      uploadedAt: string
    }) => ({
    doc_id: doc.id,
    bidder: doc.bidder,
    filename: doc.filename,
    file_type: doc.fileType,
    scanned: doc.scanned,
    status: doc.status,
    uploaded_at: doc.uploadedAt
  })
  )
}

export const createDoc = async (payload: {
  sectionId: string
  bidder: string
  filename: string
  fileType: string
  scanned: boolean
  status: string
  uploadedAt: string
  storagePath?: string | null
}) => {
  const doc = await prisma.doc.create({
    data: {
      id: `doc-${Date.now()}`,
      sectionId: payload.sectionId,
      bidder: payload.bidder,
      filename: payload.filename,
      fileType: payload.fileType,
      scanned: payload.scanned,
      status: payload.status,
      uploadedAt: payload.uploadedAt,
      storagePath: payload.storagePath ?? null,
      createdAt: new Date().toISOString()
    }
  })
  return doc
}
