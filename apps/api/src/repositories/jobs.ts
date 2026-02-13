import { prisma } from '../db.js'

export const listJobs = async () => {
  const jobs: {
    id: string
    sectionId: string
    status: string
    progress: number
    createdBy: string
    createdAt: string
    section: { name: string }
  }[] = await prisma.job.findMany({
    include: { section: true }
  })
  return jobs.map((job) => ({
    job_id: job.id,
    section_id: job.sectionId,
    section_name: job.section.name,
    status: job.status,
    progress: job.progress,
    created_by: job.createdBy,
    created_at: job.createdAt
  }))
}

export const getJob = async (jobId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } })
  if (!job) return null
  return {
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    parse_progress: job.parseProgress,
    llm_progress: job.llmProgress,
    report_progress: job.reportProgress,
    error: job.error
  }
}

export const createJob = async (payload: {
  sectionId: string
  docIds: string[]
  createdBy: string
}) => {
  const now = new Date().toISOString()
  const jobId = `job-${Date.now()}`
  await prisma.job.create({
    data: {
      id: jobId,
      sectionId: payload.sectionId,
      status: 'QUEUED',
      progress: 0,
      stage: 'QUEUED',
      parseProgress: 0,
      llmProgress: 0,
      reportProgress: 0,
      createdBy: payload.createdBy,
      createdAt: now
    }
  })

  const docs = await prisma.doc.findMany({
    where: { id: { in: payload.docIds } }
  })
  const pairs: { id: string; jobId: string; docA: string; docB: string; score: number; hits: number; status: string }[] = []
  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const a = docs[i]
      const b = docs[j]
      pairs.push({
        id: `pair-${jobId}-${i}-${j}`,
        jobId,
        docA: a.bidder,
        docB: b.bidder,
        score: 0,
        hits: 0,
        status: 'PENDING'
      })
    }
  }
  if (pairs.length > 0) {
    await prisma.pair.createMany({ data: pairs })
  }
  return jobId
}

export const listPairs = async (jobId: string) => {
  const pairs: { id: string; docA: string; docB: string; score: number; hits: number; status: string }[] =
    await prisma.pair.findMany({ where: { jobId } })
  return pairs.map((pair) => ({
    pair_id: pair.id,
    doc_a: pair.docA,
    doc_b: pair.docB,
    score: pair.score,
    hits: pair.hits,
    status: pair.status
  }))
}

export const getReport = async (jobId: string) => ({
  job_id: jobId,
  report_id: `report-${jobId}`,
  status: 'SUCCESS'
})

export const listHits = async (filters: {
  risk?: string
  sectionType?: string
  bidder?: string
  minScore?: number
  maxScore?: number
}) => {
  const hits: {
    id: string
    aDocId: string
    bDocId: string
    score: number
    rewriteRisk: string
    ruleHits: unknown
    sectionType: string
    explanation: string
    aBidder: string
    aPage: number
    aSnippet: string
    bBidder: string
    bPage: number
    bSnippet: string
    review: { result: string; remark: string | null; reviewedAt: string } | null
  }[] = await prisma.hit.findMany({
    include: { review: true }
  })
  const filtered = hits.filter((hit) => {
    if (filters.risk && hit.rewriteRisk !== filters.risk) return false
    if (filters.sectionType && hit.sectionType !== filters.sectionType) return false
    if (filters.bidder && !hit.aBidder.includes(filters.bidder) && !hit.bBidder.includes(filters.bidder)) {
      return false
    }
    if (typeof filters.minScore === 'number' && hit.score < filters.minScore) return false
    if (typeof filters.maxScore === 'number' && hit.score > filters.maxScore) return false
    return true
  })
  return filtered.map((hit) => ({
    hit_id: hit.id,
    score: hit.score,
    rewrite_risk: hit.rewriteRisk,
    rule_hits: hit.ruleHits,
    section_type: hit.sectionType,
    explanation: hit.explanation,
    a: { doc_id: hit.aDocId, bidder: hit.aBidder, page_hint: hit.aPage, snippet: hit.aSnippet },
    b: { doc_id: hit.bDocId, bidder: hit.bBidder, page_hint: hit.bPage, snippet: hit.bSnippet },
    review: hit.review
      ? { result: hit.review.result, remark: hit.review.remark ?? undefined, reviewed_at: hit.review.reviewedAt }
      : undefined
  }))
}

export const getHit = async (hitId: string) => {
  const hit = await prisma.hit.findUnique({
    where: { id: hitId },
    include: { review: true }
  })
  if (!hit) return null
  return {
    hit_id: hit.id,
    score: hit.score,
    rewrite_risk: hit.rewriteRisk,
    rule_hits: hit.ruleHits,
    section_type: hit.sectionType,
    explanation: hit.explanation,
    a: { doc_id: hit.aDocId, bidder: hit.aBidder, page_hint: hit.aPage, snippet: hit.aSnippet },
    b: { doc_id: hit.bDocId, bidder: hit.bBidder, page_hint: hit.bPage, snippet: hit.bSnippet },
    review: hit.review
      ? { result: hit.review.result, remark: hit.review.remark ?? undefined, reviewed_at: hit.review.reviewedAt }
      : undefined
  }
}

export const listAnchors = async (hitId: string) => {
  const anchors: {
    aPage: number
    bPage: number
    aBboxList: unknown
    bBboxList: unknown
    aSnippet: string
    bSnippet: string
  }[] = await prisma.anchor.findMany({ where: { hitId } })
  const normalize = (input: unknown) => {
    if (Array.isArray(input)) {
      return input
        .map((item) => {
          if (Array.isArray(item) && item.length === 4) {
            return item
          }
          if (
            item &&
            typeof item === 'object' &&
            'x' in item &&
            'y' in item &&
            'w' in item &&
            'h' in item
          ) {
            const box = item as { x: number; y: number; w: number; h: number }
            return [box.x, box.y, box.x + box.w, box.y + box.h]
          }
          return null
        })
        .filter(Boolean) as number[][]
    }
    return []
  }
  return anchors.map((anchor) => ({
    a: {
      page: anchor.aPage,
      bbox_list: normalize(anchor.aBboxList),
      snippet: anchor.aSnippet
    },
    b: {
      page: anchor.bPage,
      bbox_list: normalize(anchor.bBboxList),
      snippet: anchor.bSnippet
    }
  }))
}

export const upsertReview = async (hitId: string, payload: { result: string; remark?: string }) => {
  const review = await prisma.hitReview.upsert({
    where: { hitId },
    update: { result: payload.result, remark: payload.remark ?? null, reviewedAt: new Date().toISOString() },
    create: {
      id: `review-${hitId}`,
      hitId,
      result: payload.result,
      remark: payload.remark ?? null,
      reviewedAt: new Date().toISOString()
    }
  })
  return review
}
