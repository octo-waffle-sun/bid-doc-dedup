import type { FastifyInstance } from 'fastify'
import { getAuditLog, getInvokeLog, listAuditLogs, listInvokeLogs } from '../repositories/audit.js'

export const registerAuditRoutes = async (app: FastifyInstance) => {
  app.get('/api/audit/logs', async (request) => {
    const { purpose, status, q, page, page_size } = request.query as {
      purpose?: string
      status?: string
      q?: string
      page?: string
      page_size?: string
    }
    return listAuditLogs({
      purpose,
      status,
      q,
      page: page ? Number(page) : undefined,
      pageSize: page_size ? Number(page_size) : undefined
    })
  })
  app.get('/api/audit/logs/:logId', async (request, reply) => {
    const { logId } = request.params as { logId: string }
    const log = await getAuditLog(logId)
    if (!log) {
      reply.code(404)
      return { status: 'NOT_FOUND' }
    }
    return log
  })
  app.get('/api/audit/invoke-logs', async (request) => {
    const { job_id, provider_id, stage, status, q, page, page_size } = request.query as {
      job_id?: string
      provider_id?: string
      stage?: string
      status?: string
      q?: string
      page?: string
      page_size?: string
    }
    return listInvokeLogs({
      jobId: job_id,
      providerId: provider_id,
      stage,
      status,
      q,
      page: page ? Number(page) : undefined,
      pageSize: page_size ? Number(page_size) : undefined
    })
  })
  app.get('/api/invoke/logs', async (request) => {
    const { job_id, provider_id, stage, status, q, page, page_size } = request.query as {
      job_id?: string
      provider_id?: string
      stage?: string
      status?: string
      q?: string
      page?: string
      page_size?: string
    }
    return listInvokeLogs({
      jobId: job_id,
      providerId: provider_id,
      stage,
      status,
      q,
      page: page ? Number(page) : undefined,
      pageSize: page_size ? Number(page_size) : undefined
    })
  })
  app.get('/api/invoke/logs/:logId', async (request, reply) => {
    const { logId } = request.params as { logId: string }
    const log = await getInvokeLog(logId)
    if (!log) {
      reply.code(404)
      return { status: 'NOT_FOUND' }
    }
    return log
  })
}
