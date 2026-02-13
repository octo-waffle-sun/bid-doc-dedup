import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createJob,
  getHit,
  getJob,
  getJobHit,
  getJobHitSummary,
  getReport,
  listAnchors,
  listJobHits,
  listJobs,
  listPairs,
  upsertReview
} from '../repositories/jobs.js'

export const registerJobRoutes = async (app: FastifyInstance) => {
  app.post('/api/dedup/jobs', async (request, reply) => {
    const schema = z.object({
      section_id: z.string(),
      doc_ids: z.array(z.string()),
      mode: z.string(),
      llm_provider_id: z.string().optional(),
      ocr_provider_id: z.string().optional(),
      prompt_version: z.string(),
      options: z.record(z.string(), z.any()).optional()
    })
    const payload = schema.parse(request.body)
    const result = await createJob({
      sectionId: payload.section_id,
      docIds: payload.doc_ids,
      createdBy: '系统'
    })
    if (result.status !== 'OK') {
      if (result.status === 'SECTION_NOT_FOUND') {
        reply.code(404)
      } else {
        reply.code(409)
      }
      return { status: result.status }
    }
    return { job_id: result.jobId, status: 'QUEUED' }
  })

  app.get('/api/dedup/jobs', async (request) => {
    const { section_id } = request.query as { section_id?: string }
    return listJobs(section_id)
  })

  app.get('/api/dedup/jobs/:jobId', async (request) => {
    const { jobId } = request.params as { jobId: string }
    const job = await getJob(jobId)
    if (!job) {
      return { status: 'NOT_FOUND' }
    }
    return job
  })

  app.get('/api/dedup/jobs/:jobId/reports', async (request) => {
    const { jobId } = request.params as { jobId: string }
    return getReport(jobId)
  })

  app.get('/api/dedup/jobs/:jobId/pairs', async (request) => {
    const { jobId } = request.params as { jobId: string }
    return listPairs(jobId)
  })

  app.get('/api/dedup/jobs/:jobId/summary', async (request) => {
    const { jobId } = request.params as { jobId: string }
    return getJobHitSummary(jobId)
  })

  app.get('/api/dedup/jobs/:jobId/hits', async (request) => {
    const { jobId } = request.params as { jobId: string }
    const { risk, severity, sectionType, bidder, minScore, maxScore, docId, doc_id, q, page, page_size } = request.query as {
      risk?: string
      severity?: string
      sectionType?: string
      bidder?: string
      minScore?: string
      maxScore?: string
      docId?: string
      doc_id?: string
      q?: string
      page?: string
      page_size?: string
    }
    const min = minScore ? Number(minScore) : undefined
    const max = maxScore ? Number(maxScore) : undefined
    const data = await listJobHits(jobId, {
      risk,
      severity,
      sectionType,
      bidder,
      docId: doc_id ?? docId,
      minScore: min,
      maxScore: max,
      q,
      page: page ? Number(page) : undefined,
      pageSize: page_size ? Number(page_size) : undefined
    })
    return { job_id: jobId, ...data }
  })

  app.get('/api/dedup/jobs/:jobId/hits/:hitId', async (request) => {
    const { jobId, hitId } = request.params as { jobId: string; hitId: string }
    const hit = await getJobHit(jobId, hitId)
    if (!hit) {
      return { status: 'NOT_FOUND' }
    }
    return hit
  })

  app.get('/api/dedup/reports/:reportId/hits', async (request) => {
    const { risk, severity, sectionType, bidder, minScore, maxScore, docId, doc_id, q, page, page_size } = request.query as {
      risk?: string
      severity?: string
      sectionType?: string
      bidder?: string
      minScore?: string
      maxScore?: string
      docId?: string
      doc_id?: string
      q?: string
      page?: string
      page_size?: string
    }
    const { reportId } = request.params as { reportId: string }
    const jobId = reportId.startsWith('report-') ? reportId.replace('report-', '') : reportId
    const min = minScore ? Number(minScore) : undefined
    const max = maxScore ? Number(maxScore) : undefined
    return listJobHits(jobId, {
      risk,
      severity,
      sectionType,
      bidder,
      docId: doc_id ?? docId,
      minScore: min,
      maxScore: max,
      q,
      page: page ? Number(page) : undefined,
      pageSize: page_size ? Number(page_size) : undefined
    })
  })

  app.get('/api/dedup/reports/:reportId/summary', async (request) => {
    const { reportId } = request.params as { reportId: string }
    const jobId = reportId.startsWith('report-') ? reportId.replace('report-', '') : reportId
    return getJobHitSummary(jobId)
  })

  app.get('/api/dedup/hits/:hitId', async (request) => {
    const { hitId } = request.params as { hitId: string }
    const hit = await getHit(hitId)
    if (!hit) {
      return { status: 'NOT_FOUND' }
    }
    return hit
  })

  app.get('/api/dedup/hits/:hitId/anchors', async (request) => {
    const { hitId } = request.params as { hitId: string }
    const hit = await getHit(hitId)
    if (!hit) {
      return { status: 'NOT_FOUND' }
    }
    const anchors = await listAnchors(hitId)
    const host = request.headers.host ?? 'localhost:5175'
    const protocol = (request.headers['x-forwarded-proto'] as string) ?? 'http'
    return {
      hit_id: hitId,
      a_preview_url: `${protocol}://${host}/api/files/${hit.a.doc_id}/preview`,
      b_preview_url: `${protocol}://${host}/api/files/${hit.b.doc_id}/preview`,
      rule_hits: hit.rule_hits,
      anchors,
      explanation: hit.explanation,
      score: hit.score,
      rewrite_risk: hit.rewrite_risk
    }
  })

  app.post('/api/dedup/hits/:hitId/review', async (request) => {
    const { hitId } = request.params as { hitId: string }
    const schema = z.object({
      result: z.enum(['CONFIRMED', 'FALSE_POSITIVE', 'PENDING']),
      remark: z.string().optional()
    })
    const payload = schema.parse(request.body)
    const review = await upsertReview(hitId, payload)
    return { status: 'OK', hit_id: hitId, review: { result: review.result, remark: review.remark ?? undefined } }
  })
}
