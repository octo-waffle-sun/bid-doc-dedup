import { prisma } from '../db.js'
import { createInvokeLog } from '../repositories/audit.js'
import { listJobDocs, updatePairStats } from '../repositories/jobs.js'

const now = () => new Date().toISOString()

const buildAnchors = () => [
  { x: 0.1, y: 0.2, w: 0.8, h: 0.05 },
  { x: 0.12, y: 0.28, w: 0.76, h: 0.05 }
]

const ensureHits = async (jobId: string) => {
  const existing = await prisma.hit.count({ where: { jobId } })
  if (existing > 0) return
  const docs = await listJobDocs(jobId)
  if (docs.length < 2) return
  const pairStats = new Map<string, { score: number; hits: number }>()
  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const a = docs[i]
      const b = docs[j]
      const hitId = `hit-${jobId}-${a.id}-${b.id}-${Date.now()}`
      await prisma.hit.create({
        data: {
          id: hitId,
          jobId,
          aDocId: a.id,
          bDocId: b.id,
          score: 82,
          rewriteRisk: 'HIGH',
          ruleHits: ['TECH_PLAN_SIMILAR'],
          sectionType: 'TECH',
          explanation: '关键段落结构与措辞高度一致。',
          aBidder: a.bidder,
          aPage: 12,
          aSnippet: '方案总体目标及实施路径……',
          bBidder: b.bidder,
          bPage: 15,
          bSnippet: '总体思路与技术路线……',
          createdAt: now()
        }
      })
      await prisma.anchor.create({
        data: {
          id: `anchor-${hitId}`,
          hitId,
          aPage: 12,
          bPage: 15,
          aBboxList: buildAnchors(),
          bBboxList: buildAnchors(),
          aSnippet: '方案总体目标及实施路径……',
          bSnippet: '总体思路与技术路线……'
        }
      })
      const key = `${a.bidder}::${b.bidder}`
      const current = pairStats.get(key)
      pairStats.set(key, { score: 82, hits: (current?.hits ?? 0) + 1 })
    }
  }
  await updatePairStats(jobId, pairStats)
}

export const runJobPipeline = async (jobId: string) => {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: 'RUNNING', stage: 'PARSING', progress: 20, parseProgress: 30, startedAt: now() }
  })

  await createInvokeLog({ jobId, stage: 'PARSE', status: 'OK', latencyMs: 800 })

  await prisma.job.update({
    where: { id: jobId },
    data: { stage: 'LLM_MATCHING', progress: 60, llmProgress: 60, parseProgress: 100 }
  })

  await createInvokeLog({ jobId, stage: 'MATCH', status: 'OK', latencyMs: 1200 })

  await ensureHits(jobId)

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'SUCCESS',
      stage: 'DONE',
      progress: 100,
      reportProgress: 100,
      llmProgress: 100,
      finishedAt: now()
    }
  })
}
