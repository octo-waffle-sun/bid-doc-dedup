import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const now = () => new Date().toISOString()

export const ensureSeedData = async () => {
  const sectionCount = await prisma.section.count()
  if (sectionCount === 0) {
    await prisma.section.createMany({
      data: [
        { id: 's-001', name: '市政道路改造项目', code: 'SZ-2026-001', openedAt: '2026-02-20 09:30', createdAt: now() },
        { id: 's-002', name: '智慧园区建设项目', code: 'SZ-2026-002', openedAt: '2026-02-22 14:00', createdAt: now() }
      ]
    })
  }

  const docCount = await prisma.doc.count()
  if (docCount === 0) {
    await prisma.doc.createMany({
      data: [
        { id: 'd-01', sectionId: 's-001', bidder: '华北建设集团', filename: '技术标-华北建设.pdf', fileType: 'PDF', scanned: false, status: '解析完成', uploadedAt: '2026-02-12 11:20', createdAt: now(), storagePath: null },
        { id: 'd-02', sectionId: 's-001', bidder: '中城工程有限公司', filename: '技术标-中城工程.pdf', fileType: 'PDF', scanned: true, status: '待OCR', uploadedAt: '2026-02-12 13:45', createdAt: now(), storagePath: null },
        { id: 'd-03', sectionId: 's-002', bidder: '远方建筑有限公司', filename: '技术标-远方建筑.pdf', fileType: 'PDF', scanned: false, status: '解析完成', uploadedAt: '2026-02-11 09:20', createdAt: now(), storagePath: null },
        { id: 'd-04', sectionId: 's-002', bidder: '远航建设集团', filename: '技术标-远航建设.pdf', fileType: 'PDF', scanned: false, status: '解析完成', uploadedAt: '2026-02-11 09:40', createdAt: now(), storagePath: null }
      ]
    })
  }

  const providerCount = await prisma.provider.count()
  if (providerCount === 0) {
    await prisma.provider.createMany({
      data: [
        { id: 'p-01', type: 'LLM', name: 'OpenAI', model: 'gpt-4.1', qps: 5, enabled: true, baseUrl: null, apiKeyEncrypted: null, createdAt: now() },
        { id: 'p-02', type: 'OCR', name: '本地OCR', model: 'PaddleOCR-PP-OCRv4', qps: 2, enabled: true, baseUrl: null, apiKeyEncrypted: null, createdAt: now() }
      ]
    })
  }

  const promptCount = await prisma.prompt.count()
  if (promptCount === 0) {
    await prisma.prompt.createMany({
      data: [
        { id: 'prompt-01', type: 'ALIGN', promptVersion: 'v1.0', content: null, updatedAt: now(), updatedBy: 'admin' },
        { id: 'prompt-02', type: 'COMPARE', promptVersion: 'v1.0', content: null, updatedAt: now(), updatedBy: 'admin' }
      ]
    })
  }

  const ruleCount = await prisma.rule.count()
  if (ruleCount === 0) {
    await prisma.rule.createMany({
      data: [
        { id: 'rule-01', name: 'TECH_PLAN_SIMILAR', threshold: 0.8, level: 'HIGH', enabled: true, createdAt: now() },
        { id: 'rule-02', name: 'STRUCTURE_SIMILAR', threshold: 0.7, level: 'MED', enabled: true, createdAt: now() },
        { id: 'rule-03', name: 'PHRASE_COVERAGE', threshold: 0.6, level: 'LOW', enabled: true, createdAt: now() }
      ]
    })
  }

  const jobCount = await prisma.job.count()
  if (jobCount === 0) {
    await prisma.job.createMany({
      data: [
        {
          id: 'job-1001',
          sectionId: 's-001',
          status: 'RUNNING',
          progress: 62,
          stage: 'LLM_MATCHING',
          parseProgress: 80,
          llmProgress: 55,
          reportProgress: 30,
          createdBy: '评审秘书-张敏',
          createdAt: '2026-02-12 16:10',
          startedAt: null,
          finishedAt: null,
          error: null
        },
        {
          id: 'job-1002',
          sectionId: 's-002',
          status: 'SUCCESS',
          progress: 100,
          stage: 'DONE',
          parseProgress: 100,
          llmProgress: 100,
          reportProgress: 100,
          createdBy: '评审专家-李伟',
          createdAt: '2026-02-11 09:40',
          startedAt: null,
          finishedAt: '2026-02-11 11:20',
          error: null
        }
      ]
    })
  }

  const pairCount = await prisma.pair.count()
  if (pairCount === 0) {
    await prisma.pair.createMany({
      data: [
        { id: 'pair-01', jobId: 'job-1001', docA: '华北建设集团', docB: '中城工程有限公司', score: 86, hits: 12, status: 'SUCCESS' },
        { id: 'pair-02', jobId: 'job-1001', docA: '华北建设集团', docB: '远方建筑有限公司', score: 72, hits: 8, status: 'RUNNING' }
      ]
    })
  }

  const hitCount = await prisma.hit.count()
  if (hitCount === 0) {
    await prisma.hit.createMany({
      data: [
        {
          id: 'hit-01',
          jobId: 'job-1001',
          aDocId: 'd-01',
          bDocId: 'd-02',
          score: 86,
          rewriteRisk: 'HIGH',
          ruleHits: ['TECH_PLAN_SIMILAR', 'STRUCTURE_SIMILAR'],
          sectionType: 'TECH',
          explanation: '总体技术路线与关键步骤描述高度一致，存在改写式复用。',
          aBidder: '华北建设集团',
          aPage: 12,
          aSnippet: '总体技术路线与关键步骤描述高度一致。',
          bBidder: '中城工程有限公司',
          bPage: 15,
          bSnippet: '总体思路与技术路线高度一致。',
          createdAt: now()
        },
        {
          id: 'hit-02',
          jobId: 'job-1001',
          aDocId: 'd-01',
          bDocId: 'd-03',
          score: 72,
          rewriteRisk: 'MED',
          ruleHits: ['CHAPTER_SEQUENCE_SIMILAR'],
          sectionType: 'BIZ',
          explanation: '章节结构与标题序列相似度较高。',
          aBidder: '华北建设集团',
          aPage: 22,
          aSnippet: '章节结构与标题序列相似度较高。',
          bBidder: '远方建筑有限公司',
          bPage: 23,
          bSnippet: '章节结构与标题序列相似度较高。',
          createdAt: now()
        }
      ]
    })
  }

  const anchorCount = await prisma.anchor.count()
  if (anchorCount === 0) {
    await prisma.anchor.createMany({
      data: [
        {
          id: 'anchor-01',
          hitId: 'hit-01',
          aPage: 12,
          bPage: 15,
          aBboxList: [{ x: 0.1, y: 0.2, w: 0.8, h: 0.05 }],
          bBboxList: [{ x: 0.12, y: 0.18, w: 0.76, h: 0.05 }],
          aSnippet: '方案总体目标及实施路径……',
          bSnippet: '总体思路与技术路线……'
        }
      ]
    })
  }

  const auditCount = await prisma.auditLog.count()
  if (auditCount === 0) {
    await prisma.auditLog.createMany({
      data: [
        { id: 'log-001', provider: 'OpenAI', purpose: 'COMPARE', latency: 1820, status: 'OK', createdAt: '2026-02-12 16:12' },
        { id: 'log-002', provider: '本地OCR', purpose: 'OCR', latency: 3200, status: 'OK', createdAt: '2026-02-12 16:05' }
      ]
    })
  }
}
