import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { openApiDocument } from './swagger/openapi';
import webhooksStripeRoutes from './modules/webhooks/webhooksStripeRoutes';
import { startCancelStalePendingOrdersJob } from './jobs/cancelStalePendingOrders';

const app = express();

app.use(helmet());

// Best-effort attachment of authenticated user to the request for logging purposes.
// This is intentionally non-strict: it never throws, it only sets `req.user` when a valid JWT is present.
app.use((req: any, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, env.jwtSecret) as {
        sub: string;
        email: string;
        role?: string;
        name?: string;
      };
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };
    } catch {
      // Ignore invalid tokens here; authMiddleware will still enforce auth on protected routes.
    }
  }
  next();
});

// Extend HTTP logs with authenticated user info while preserving the existing structure.
// We mirror morgan's built-in formats and append a `user=:user` field at the end.
morgan.token('user', (req: any) => {
  const user = (req as any).user;
  if (!user) return 'anonymous';

  const id = (user as any).id;
  const email = (user as any).email;

  if (id && email) return `${id}:${email}`;
  if (id) return String(id);
  if (email) return String(email);

  return 'authenticated';
});

const morganFormat =
  env.nodeEnv === 'development'
    ? ':method :url :status :response-time ms - :res[content-length] user=:user'
    : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" user=:user';

app.use(morgan(morganFormat));
app.use(cors({ origin: env.corsOrigin.split(',').map((o) => o.trim()), credentials: true }));

// Stripe webhook must receive raw body for signature verification (before express.json())
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksStripeRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (e.g. avatars)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/docs-json', (_req, res) => {
  res.json(openApiDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

import apiRoutes from './routes';
app.use('/api', apiRoutes);

app.use(errorHandler);

startCancelStalePendingOrdersJob();

export default app;
