import type { FastifyInstance } from 'fastify'
import { listAuditLogs } from '../repositories/audit.js'

export const registerAuditRoutes = async (app: FastifyInstance) => {
  app.get('/api/audit/invoke-logs', async () => listAuditLogs())
}
