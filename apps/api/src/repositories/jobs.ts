import { prisma } from '../db.js'

export const listJobs = async (sectionId?: string) => {
  const jobs: {
    id: string
    sectionId: string
    status: string
    progress: number
    createdBy: string
    createdAt: string
    section: { name: string }
  }[] = await prisma.job.findMany({
    include: { section: true },
    where: sectionId ? { sectionId } : undefined,
    orderBy: { createdAt: 'desc' }
  })
  const jobIds = jobs.map((job) => job.id)
  const jobDocRows: { jobId: string }[] = await prisma.jobDoc.findMany({
    where: { jobId: { in: jobIds } },
    select: { jobId: true }
  })
  const pairRows: { jobId: string }[] = await prisma.pair.findMany({
    where: { jobId: { in: jobIds } },
    select: { jobId: true }
  })
  const hitRows: { jobId: string }[] = await prisma.hit.findMany({
    where: { jobId: { in: jobIds } },
    select: { jobId: true }
  })
  const docCountMap = new Map<string, number>()
  const pairCountMap = new Map<string, number>()
  const hitCountMap = new Map<string, number>()
  for (const row of jobDocRows) {
    docCountMap.set(row.jobId, (docCountMap.get(row.jobId) ?? 0) + 1)
  }
  for (const row of pairRows) {
    pairCountMap.set(row.jobId, (pairCountMap.get(row.jobId) ?? 0) + 1)
  }
  for (const row of hitRows) {
    hitCountMap.set(row.jobId, (hitCountMap.get(row.jobId) ?? 0) + 1)
  }
  return jobs.map((job) => ({
    job_id: job.id,
    section_id: job.sectionId,
    section_name: job.section.name,
    status: job.status,
    progress: job.progress,
    created_by: job.createdBy,
    created_at: job.createdAt,
    doc_count: docCountMap.get(job.id) ?? 0,
    pair_count: pairCountMap.get(job.id) ?? 0,
    hit_count: hitCountMap.get(job.id) ?? 0
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
  const section = await prisma.section.findUnique({ where: { id: payload.sectionId } })
  if (!section) {
    return { status: 'SECTION_NOT_FOUND' as const }
  }
  const docs: { id: string; bidder: string }[] = await prisma.doc.findMany({
    where: { id: { in: payload.docIds }, sectionId: payload.sectionId }
  })
  if (docs.length !== payload.docIds.length) {
    return { status: 'INVALID_DOCS' as const }
  }
  if (docs.length < 2) {
    return { status: 'NOT_ENOUGH_DOCS' as const }
  }
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
  await prisma.jobDoc.createMany({
    data: docs.map((doc: { id: string }) => ({
      id: `jobdoc-${jobId}-${doc.id}`,
      jobId,
      docId: doc.id,
      createdAt: now
    }))
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
  return { status: 'OK' as const, jobId }
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

export const listJobHits = async (jobId: string, filters: {
  risk?: string
  sectionType?: string
  bidder?: string
  docId?: string
  minScore?: number
  maxScore?: number
}) => {
  const andFilters: {
    OR: { aDocId?: string; bDocId?: string; aBidder?: { contains: string }; bBidder?: { contains: string } }[]
  }[] = []
  if (filters.docId) {
    andFilters.push({ OR: [{ aDocId: filters.docId }, { bDocId: filters.docId }] })
  }
  if (filters.bidder) {
    andFilters.push({ OR: [{ aBidder: { contains: filters.bidder } }, { bBidder: { contains: filters.bidder } }] })
  }
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
    include: { review: true },
    where: {
      jobId,
      rewriteRisk: filters.risk,
      sectionType: filters.sectionType,
      ...(andFilters.length > 0 ? { AND: andFilters } : undefined),
      ...(typeof filters.minScore === 'number' || typeof filters.maxScore === 'number'
        ? {
            score: {
              ...(typeof filters.minScore === 'number' ? { gte: filters.minScore } : undefined),
              ...(typeof filters.maxScore === 'number' ? { lte: filters.maxScore } : undefined)
            }
          }
        : undefined)
    }
  })
  return hits.map((hit) => ({
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
          if (
            item &&
            typeof item === 'object' &&
            'x' in item &&
            'y' in item &&
            'w' in item &&
            'h' in item
          ) {
            const box = item as { x: number; y: number; w: number; h: number }
            return { x: box.x, y: box.y, w: box.w, h: box.h }
          }
          if (Array.isArray(item) && item.length === 4 && item.every((value) => typeof value === 'number')) {
            const [x1, y1, x2, y2] = item as number[]
            return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
          }
          return null
        })
        .filter(Boolean) as { x: number; y: number; w: number; h: number }[]
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

export const listJobDocs = async (jobId: string) => {
  const records: { doc: { id: string; bidder: string; filename: string; fileType: string } }[] =
    await prisma.jobDoc.findMany({
    where: { jobId },
    include: { doc: true }
  })
  return records.map((record: { doc: { id: string; bidder: string; filename: string; fileType: string } }) => record.doc)
}

export const failJob = async (jobId: string, error: string) => {
  const now = new Date().toISOString()
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'FAILED', stage: 'FAILED', error, finishedAt: now }
  })
}

export const updatePairStats = async (jobId: string, stats: Map<string, { score: number; hits: number }>) => {
  const pairs = await prisma.pair.findMany({ where: { jobId } })
  for (const pair of pairs) {
    const key = `${pair.docA}::${pair.docB}`
    const payload = stats.get(key)
    if (payload) {
      await prisma.pair.update({
        where: { id: pair.id },
        data: { status: 'SUCCESS', score: payload.score, hits: payload.hits }
      })
    }
  }
}
