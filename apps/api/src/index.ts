import Fastify from 'fastify'
import cors from '@fastify/cors'
import { z } from 'zod'

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

const now = () => new Date().toISOString()

const providers = [
  { provider_id: 'p-01', type: 'LLM', name: 'OpenAI', model: 'gpt-4.1', qps: 5, enabled: true },
  { provider_id: 'p-02', type: 'OCR', name: '本地OCR', model: 'PaddleOCR-PP-OCRv4', qps: 2, enabled: true }
]

const prompts = [
  { prompt_version: 'v1.0', type: 'ALIGN', updated_at: now(), updated_by: 'admin' },
  { prompt_version: 'v1.0', type: 'COMPARE', updated_at: now(), updated_by: 'admin' }
]

const rules = [
  { name: 'TECH_PLAN_SIMILAR', threshold: 0.8, level: 'HIGH' },
  { name: 'STRUCTURE_SIMILAR', threshold: 0.7, level: 'MED' },
  { name: 'PHRASE_COVERAGE', threshold: 0.6, level: 'LOW' }
]

const sections = [
  { section_id: 's-001', name: '市政道路改造项目', code: 'SZ-2026-001', opened_at: '2026-02-20 09:30' },
  { section_id: 's-002', name: '智慧园区建设项目', code: 'SZ-2026-002', opened_at: '2026-02-22 14:00' }
]

const sectionDocs = [
  {
    section_id: 's-001',
    docs: [
      {
        doc_id: 'd-01',
        bidder: '华北建设集团',
        filename: '技术标-华北建设.pdf',
        file_type: 'PDF',
        scanned: false,
        status: '解析完成',
        uploaded_at: '2026-02-12 11:20'
      },
      {
        doc_id: 'd-02',
        bidder: '中城工程有限公司',
        filename: '技术标-中城工程.pdf',
        file_type: 'PDF',
        scanned: true,
        status: '待OCR',
        uploaded_at: '2026-02-12 13:45'
      }
    ]
  },
  {
    section_id: 's-002',
    docs: [
      {
        doc_id: 'd-03',
        bidder: '远方建筑有限公司',
        filename: '技术标-远方建筑.pdf',
        file_type: 'PDF',
        scanned: false,
        status: '解析完成',
        uploaded_at: '2026-02-11 09:20'
      },
      {
        doc_id: 'd-04',
        bidder: '远航建设集团',
        filename: '技术标-远航建设.pdf',
        file_type: 'PDF',
        scanned: false,
        status: '解析完成',
        uploaded_at: '2026-02-11 09:40'
      }
    ]
  }
]

const jobs = [
  {
    job_id: 'job-1001',
    section_id: 's-001',
    section_name: '市政道路改造项目',
    status: 'RUNNING',
    progress: 62,
    created_by: '评审秘书-张敏',
    created_at: '2026-02-12 16:10'
  },
  {
    job_id: 'job-1002',
    section_id: 's-002',
    section_name: '智慧园区建设项目',
    status: 'SUCCESS',
    progress: 100,
    created_by: '评审专家-李伟',
    created_at: '2026-02-11 09:40'
  }
]

const jobPairs = [
  {
    job_id: 'job-1001',
    pairs: [
      { pair_id: 'pair-01', doc_a: '华北建设集团', doc_b: '中城工程有限公司', score: 86, hits: 12, status: 'SUCCESS' },
      { pair_id: 'pair-02', doc_a: '华北建设集团', doc_b: '远方建筑有限公司', score: 72, hits: 8, status: 'RUNNING' }
    ]
  }
]

const auditLogs = [
  { id: 'log-001', provider: 'OpenAI', purpose: 'COMPARE', latency: 1820, status: 'OK', created_at: '2026-02-12 16:12' },
  { id: 'log-002', provider: '本地OCR', purpose: 'OCR', latency: 3200, status: 'OK', created_at: '2026-02-12 16:05' }
]

const hits = [
  {
    hit_id: 'hit-01',
    score: 86,
    rewrite_risk: 'HIGH',
    rule_hits: ['TECH_PLAN_SIMILAR', 'STRUCTURE_SIMILAR'],
    section_type: 'TECH',
    a: { doc_id: 'A', bidder: '华北建设集团', page_hint: 12, snippet: '总体技术路线与关键步骤描述高度一致。' },
    b: { doc_id: 'B', bidder: '中城工程有限公司', page_hint: 15, snippet: '总体思路与技术路线高度一致。' }
  },
  {
    hit_id: 'hit-02',
    score: 72,
    rewrite_risk: 'MED',
    rule_hits: ['CHAPTER_SEQUENCE_SIMILAR'],
    section_type: 'BIZ',
    a: { doc_id: 'A', bidder: '华北建设集团', page_hint: 22, snippet: '章节结构与标题序列相似度较高。' },
    b: { doc_id: 'C', bidder: '远方建筑有限公司', page_hint: 23, snippet: '章节结构与标题序列相似度较高。' }
  }
]

const hitReviews = new Map<string, { result: string; remark?: string; reviewed_at: string }>()

app.get('/api/health', async () => ({ status: 'ok' }))

app.post('/api/files/upload', async () => ({
  doc_id: 'doc-001',
  version_id: 'ver-001'
}))

app.get('/api/sections', async () =>
  sections.map((section) => ({
    section_id: section.section_id,
    name: section.name,
    code: section.code,
    opened_at: section.opened_at,
    bidder_count: sectionDocs.find((item) => item.section_id === section.section_id)?.docs.length ?? 0
  }))
)

app.get('/api/sections/:sectionId', async (request) => {
  const { sectionId } = request.params as { sectionId: string }
  const section = sections.find((item) => item.section_id === sectionId)
  if (!section) {
    return { status: 'NOT_FOUND' }
  }
  const docCount = sectionDocs.find((item) => item.section_id === sectionId)?.docs.length ?? 0
  return { ...section, doc_count: docCount }
})

app.get('/api/sections/:sectionId/docs', async (request) => {
  const { sectionId } = request.params as { sectionId: string }
  const docs = sectionDocs.find((item) => item.section_id === sectionId)?.docs ?? []
  return docs
})

app.get('/api/files/:docId/preview', async (request) => {
  const { docId } = request.params as { docId: string }
  return { doc_id: docId, preview_url: `https://example.com/preview/${docId}.pdf` }
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

app.post('/api/dedup/jobs', async (request) => {
  const schema = z.object({
    section_id: z.string(),
    doc_ids: z.array(z.string()),
    mode: z.string(),
    llm_provider_id: z.string().optional(),
    ocr_provider_id: z.string().optional(),
    prompt_version: z.string(),
    options: z.record(z.string(), z.any()).optional()
  })
  schema.parse(request.body)
  return { job_id: 'job-1001', status: 'PENDING' }
})

app.get('/api/dedup/jobs', async () => jobs)

app.get('/api/dedup/jobs/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string }
  return {
    job_id: jobId,
    status: 'RUNNING',
    progress: 62,
    stage: 'LLM_MATCHING',
    parse_progress: 80,
    llm_progress: 55,
    report_progress: 30
  }
})

app.get('/api/dedup/jobs/:jobId/reports', async (request) => {
  const { jobId } = request.params as { jobId: string }
  return {
    job_id: jobId,
    report_id: 'report-001',
    status: 'PARTIAL_SUCCESS'
  }
})

app.get('/api/dedup/jobs/:jobId/pairs', async (request) => {
  const { jobId } = request.params as { jobId: string }
  return jobPairs.find((item) => item.job_id === jobId)?.pairs ?? []
})

app.get('/api/dedup/reports/:reportId/summary', async () => {
  const high = hits.filter((hit) => hit.rewrite_risk === 'HIGH').length
  const med = hits.filter((hit) => hit.rewrite_risk === 'MED').length
  const low = hits.filter((hit) => hit.rewrite_risk === 'LOW').length
  return { high, med, low, top_section: '技术方案' }
})

app.get('/api/dedup/reports/:reportId/hits', async (request) => {
  const { risk, sectionType, bidder, minScore, maxScore } = request.query as {
    risk?: string
    sectionType?: string
    bidder?: string
    minScore?: string
    maxScore?: string
  }
  const min = minScore ? Number(minScore) : undefined
  const max = maxScore ? Number(maxScore) : undefined
  const filtered = hits.filter((hit) => {
    if (risk && hit.rewrite_risk !== risk) return false
    if (sectionType && hit.section_type !== sectionType) return false
    if (bidder && !hit.a.bidder.includes(bidder) && !hit.b.bidder.includes(bidder)) return false
    if (typeof min === 'number' && hit.score < min) return false
    if (typeof max === 'number' && hit.score > max) return false
    return true
  })
  return filtered.map((hit) => ({
    ...hit,
    review: hitReviews.get(hit.hit_id)
  }))
})

app.get('/api/dedup/hits/:hitId', async (request) => {
  const { hitId } = request.params as { hitId: string }
  const hit = hits.find((item) => item.hit_id === hitId)
  if (!hit) {
    return { status: 'NOT_FOUND' }
  }
  const review = hitReviews.get(hitId)
  return {
    ...hit,
    review
  }
})

app.get('/api/dedup/hits/:hitId/anchors', async (request) => {
  const { hitId } = request.params as { hitId: string }
  return {
    hit_id: hitId,
    a_preview_url: 'https://example.com/preview/docA.pdf',
    b_preview_url: 'https://example.com/preview/docB.pdf',
    rule_hits: ['TECH_PLAN_SIMILAR', 'STRUCTURE_SIMILAR'],
    anchors: [
      {
        a: { page: 12, bbox_list: [[0.1, 0.2, 0.9, 0.25]], snippet: '方案总体目标及实施路径……' },
        b: { page: 15, bbox_list: [[0.12, 0.18, 0.88, 0.23]], snippet: '总体思路与技术路线……' }
      }
    ],
    explanation: '总体技术路线与关键步骤描述高度一致，存在改写式复用。',
    score: 86,
    rewrite_risk: 'HIGH'
  }
})

app.post('/api/dedup/hits/:hitId/review', async (request) => {
  const { hitId } = request.params as { hitId: string }
  const schema = z.object({
    result: z.enum(['CONFIRMED', 'FALSE_POSITIVE', 'PENDING']),
    remark: z.string().optional()
  })
  const payload = schema.parse(request.body)
  const record = { ...payload, reviewed_at: now() }
  hitReviews.set(hitId, record)
  return { status: 'OK', hit_id: hitId, review: record }
})

app.get('/api/config/llm-providers', async () => providers)

app.post('/api/config/llm-providers', async (request) => {
  const schema = z.object({
    type: z.string(),
    name: z.string(),
    endpoint: z.string().optional(),
    model: z.string().optional()
  })
  schema.parse(request.body)
  return { status: 'OK' }
})

app.get('/api/config/prompts', async () => prompts)

app.get('/api/config/rules', async () => rules)

app.post('/api/config/prompts', async (request) => {
  const schema = z.object({
    prompt_version: z.string(),
    type: z.string(),
    template_text: z.string()
  })
  schema.parse(request.body)
  return { status: 'OK' }
})

app.post('/api/config/test-invoke', async () => ({ status: 'OK' }))

app.get('/api/audit/invoke-logs', async () => auditLogs)

const port = Number(process.env.PORT ?? 5175)
await app.listen({ port, host: '0.0.0.0' })
