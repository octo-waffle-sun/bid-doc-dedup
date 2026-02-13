import { prisma } from '../db.js'

export const listAuditLogs = async (params: {
  purpose?: string
  status?: string
  q?: string
  page?: number
  pageSize?: number
}) => {
  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20
  const where = {
    purpose: params.purpose,
    status: params.status,
    ...(params.q
      ? {
          OR: [
            { id: { contains: params.q } },
            { provider: { contains: params.q } },
            { purpose: { contains: params.q } },
            { status: { contains: params.q } }
          ]
        }
      : undefined)
  }
  const [total, logs]: [
    number,
    { id: string; provider: string; purpose: string; latency: number; status: string; createdAt: string }[]
  ] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])
  return {
    items: logs.map((log: { id: string; provider: string; purpose: string; latency: number; status: string; createdAt: string }) => ({
      id: log.id,
      provider: log.provider,
      purpose: log.purpose,
      latency: log.latency,
      status: log.status,
      created_at: log.createdAt
    })),
    total,
    page,
    page_size: pageSize
  }
}

export const listInvokeLogs = async (params: {
  jobId?: string
  providerId?: string
  stage?: string
  status?: string
  q?: string
  page?: number
  pageSize?: number
}) => {
  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize = params.pageSize && params.pageSize > 0 ? Math.min(params.pageSize, 100) : 20
  const where = {
    jobId: params.jobId,
    providerId: params.providerId,
    stage: params.stage,
    status: params.status,
    ...(params.q
      ? {
          OR: [
            { id: { contains: params.q } },
            { jobId: { contains: params.q } },
            { providerId: { contains: params.q } },
            { stage: { contains: params.q } },
            { status: { contains: params.q } },
            { error: { contains: params.q } }
          ]
        }
      : undefined)
  }
  const [total, logs]: [
    number,
    {
      id: string
      jobId: string | null
      providerId: string | null
      stage: string
      status: string
      latencyMs: number | null
      error: string | null
      createdAt: string
    }[]
  ] = await prisma.$transaction([
    prisma.invokeLog.count({ where }),
    prisma.invokeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])
  return {
    items: logs.map(
      (log: {
        id: string
        jobId: string | null
        providerId: string | null
        stage: string
        status: string
        latencyMs: number | null
        error: string | null
        createdAt: string
      }) => ({
      id: log.id,
      job_id: log.jobId ?? undefined,
      provider_id: log.providerId ?? undefined,
      stage: log.stage,
      status: log.status,
      latency_ms: log.latencyMs ?? undefined,
      error: log.error ?? undefined,
      created_at: log.createdAt
    })),
    total,
    page,
    page_size: pageSize
  }
}

export const getAuditLog = async (logId: string) => {
  const log = await prisma.auditLog.findUnique({ where: { id: logId } })
  if (!log) return null
  return {
    id: log.id,
    provider: log.provider,
    purpose: log.purpose,
    latency: log.latency,
    status: log.status,
    created_at: log.createdAt
  }
}

export const getInvokeLog = async (logId: string) => {
  const log = await prisma.invokeLog.findUnique({ where: { id: logId } })
  if (!log) return null
  return {
    id: log.id,
    job_id: log.jobId ?? undefined,
    provider_id: log.providerId ?? undefined,
    stage: log.stage,
    status: log.status,
    tokens: log.tokens ?? undefined,
    latency_ms: log.latencyMs ?? undefined,
    error: log.error ?? undefined,
    request_meta_json: log.requestMetaJson ?? undefined,
    response_meta_json: log.responseMetaJson ?? undefined,
    created_at: log.createdAt
  }
}

export const createInvokeLog = async (payload: {
  jobId?: string
  providerId?: string
  stage: string
  status: string
  latencyMs?: number
  error?: string
}) => {
  const record = await prisma.invokeLog.create({
    data: {
      id: `invoke-${Date.now()}`,
      jobId: payload.jobId ?? null,
      providerId: payload.providerId ?? null,
      stage: payload.stage,
      status: payload.status,
      latencyMs: payload.latencyMs ?? null,
      error: payload.error ?? null,
      createdAt: new Date().toISOString()
    }
  })
  return record
}
