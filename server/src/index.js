import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { csrfProtection } from './middleware/csrf.js';
import { authenticateSession } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import customerRoutes from './routes/customer.routes.js';
import orderRoutes from './routes/order.routes.js';
import noteRoutes from './routes/note.routes.js';
import taskRoutes from './routes/task.routes.js';
import templateRoutes from './routes/template.routes.js';
import commRoutes from './routes/communication.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import agentRoutes from './routes/agent.routes.js';
import syncRoutes from './routes/sync.routes.js';
import webhookRoutes from './routes/webhook.routes.js';

import { runAllActiveWorkflows } from './services/workflow.service.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// CORS configuration
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-wc-webhook-topic', 'x-wc-webhook-delivery-id', 'x-wc-webhook-signature']
}));

// Body parsers with rawBody retention for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Anti-CSRF protection (bypasses webhooks and safe methods)
app.use(csrfProtection);

// Session authentication on all incoming requests
app.use(authenticateSession);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Merqanta API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    authConfig: {
      authenticated: Boolean(req.user),
      user: req.user ? { email: req.user.email, role: req.user.role } : null
    }
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/communications', commRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/webhooks', webhookRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Merqanta API Server running on port ${PORT}`);
  console.log(`   Database configured via Prisma`);
  console.log(`   CORS Origin allowed: ${CLIENT_ORIGIN}`);
});

// Workflow background runner (interval-based scheduler)
const schedulerInterval = parseInt(process.env.WORKFLOW_SCHEDULER_INTERVAL_MS || '60000', 10);
const workflowTimer = setInterval(async () => {
  try {
    await runAllActiveWorkflows();
  } catch (err) {
    console.error('Scheduled workflow error:', err.message);
  }
}, schedulerInterval);

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(workflowTimer);
  server.close(() => process.exit(0));
});

export default app;
