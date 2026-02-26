import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { openApiDocument } from './swagger/openapi';
import webhooksStripeRoutes from './modules/webhooks/webhooksStripeRoutes';

const app = express();

app.use(helmet());
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
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

export default app;
