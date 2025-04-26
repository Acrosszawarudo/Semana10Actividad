const express = require('express');
const promClient = require('prom-client');
const winston = require('winston');

// Create Express app
const app = express();
const metricsApp = express();

// Setup Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestCounter);

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sample-app' },
  transports: [
    new winston.transports.Console()
  ]
});

// Middleware to track metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  
  // Record request in logs
  logger.info(`Received request: ${req.method} ${req.url}`);
  
  // Add listener for response finish event
  res.on('finish', () => {
    const duration = end();
    const status = res.statusCode;
    
    // Update metrics
    httpRequestCounter.inc({ method: req.method, route: req.path, status });
    
    // Log response
    logger.info(`Completed request: ${req.method} ${req.url} with status ${status} in ${duration}s`);
  });
  
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.send('Welcome to the Sample App!');
});

app.get('/error', (req, res) => {
  logger.error('This is a sample error!');
  res.status(500).send('Intentional error triggered');
});

app.get('/slow', (req, res) => {
  // Simulate a slow response
  setTimeout(() => {
    res.send('This was a slow response');
  }, 2000);
});

// Metrics endpoint for Prometheus
metricsApp.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start servers
app.listen(3000, () => {
  logger.info('Sample app listening on port 3000');
});

metricsApp.listen(3001, () => {
  logger.info('Metrics server listening on port 3001');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason });
});