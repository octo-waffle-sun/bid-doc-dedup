import { prisma } from '../db.js'

export const listAuditLogs = async () => {
  const logs: { id: string; provider: string; purpose: string; latency: number; status: string; createdAt: string }[] =
    await prisma.auditLog.findMany()
  return logs.map((log) => ({
    id: log.id,
    provider: log.provider,
    purpose: log.purpose,
    latency: log.latency,
    status: log.status,
    created_at: log.createdAt
  }))
}

export const listInvokeLogs = async () => {
  const logs: {
    id: string
    jobId: string | null
    providerId: string | null
    stage: string
    status: string
    latencyMs: number | null
    error: string | null
    createdAt: string
  }[] = await prisma.invokeLog.findMany()
  return logs.map((log) => ({
    id: log.id,
    job_id: log.jobId ?? undefined,
    provider_id: log.providerId ?? undefined,
    stage: log.stage,
    status: log.status,
    latency_ms: log.latencyMs ?? undefined,
    error: log.error ?? undefined,
    created_at: log.createdAt
  }))
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
