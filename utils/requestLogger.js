import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import logger from './logger.js';

const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customProps: (req) => ({
    requestId: req.id,
    userId: req.user?.id,
  }),
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.originalUrl || req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default requestLogger;
