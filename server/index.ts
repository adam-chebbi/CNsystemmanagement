import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import './db/connection.js';
import { runSeed } from './seed/index.js';
import { authRouter } from './routes/auth.js';
import { productCatalogRouter } from './routes/productCatalog.js';
import { stockRouter } from './routes/stock.js';
import { salesRouter } from './routes/sales.js';
import { expensesRouter } from './routes/expenses.js';
import { purchasesRouter } from './routes/purchases.js';
import { hrRouter } from './routes/hr.js';
import { notificationsRouter } from './routes/notifications.js';
import { activityLogRouter } from './routes/activityLog.js';
import { errorMiddleware } from './middleware/errors.js';
import { ensureCsrfCookie, csrfProtection } from './middleware/csrf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

runSeed();

const app = express();
app.use(express.json({ limit: '15mb' }));
app.use(cookieParser());
// Runs on every request (app shell + API) so the CSRF cookie is already set before the first
// state-changing request — see server/middleware/csrf.ts.
app.use(ensureCsrfCookie);
app.use('/api', csrfProtection);

app.use('/api/auth', authRouter);
app.use('/api', productCatalogRouter);
app.use('/api/stock', stockRouter);
app.use('/api/sales', salesRouter);
app.use('/api', expensesRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/hr', hrRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/activity-log', activityLogRouter);

app.use(errorMiddleware);

const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Café Noir API listening on http://localhost:${port}`);
});
