import type { FastifyInstance } from 'fastify'
import { listAuditLogs, listInvokeLogs } from '../repositories/audit.js'

export const registerAuditRoutes = async (app: FastifyInstance) => {
  app.get('/api/audit/logs', async () => listAuditLogs())
  app.get('/api/audit/invoke-logs', async () => listInvokeLogs())
}
