import { env } from './utils/env.js';
import express from 'express';
import cors from 'cors';
import http from 'http';
import matchRouter from './routes/matches.js';
import commentaryRouter from './routes/commentary.js';
import { attachWebSocketServer } from './ws/server.js';
import { startStatusSyncJob } from './utils/status-sync.js';
import { errorHandler } from './middleware/error-handler.js';
import { securityMiddleware, wsArcjet } from './middleware/arcjet.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(securityMiddleware);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Sportz API' });
});

app.use('/matches', matchRouter);
app.use('/matches/:matchId/commentary', commentaryRouter);

const ws = attachWebSocketServer(server, wsArcjet);
app.locals.broadcastMatchCreated = ws.broadcastMatchCreated;
app.locals.broadcastScoreUpdate = ws.broadcastScoreUpdate;
app.locals.broadcastCommentaryAdded = ws.broadcastCommentaryAdded;

startStatusSyncJob(ws.broadcastStatusChange);

app.use(errorHandler);

server.listen(env.PORT, env.HOST, () => {
  const baseUrl = env.HOST === '0.0.0.0'
    ? `http://localhost:${env.PORT}`
    : `http://${env.HOST}:${env.PORT}`;

  console.log(`Server running at ${baseUrl}`);
  console.log(`WebSocket server running at ${baseUrl.replace('http', 'ws')}/ws`);
});
