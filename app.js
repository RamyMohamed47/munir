import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean/lib/xss.js';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';
import requestLogger from './utils/requestLogger.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import openApiDocument from './docs/openapi.js';

const { clean: cleanXss } = xssClean;

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(cors());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'none'"],
      },
    },
  }),
);

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests, please try again in an hour',
});
app.use('/api', requestLogger);
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
    req.body = cleanXss(req.body);
  }

  if (req.params) {
    mongoSanitize.sanitize(req.params);
  }

  next();
});

app.use(
  hpp({
    whitelist: [],
  }),
);

app.use(compression());

app.get('/api-docs.json', (req, res) => {
  res.status(200).json(openApiDocument);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Munir API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

app.use('/api/v1/users', userRouter);
app.use('/api/v1/messages', messageRouter);


app.all('/{*any}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
