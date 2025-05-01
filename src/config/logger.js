const winston = require('winston');

const { format, createLogger, transports } = winston;
const { printf, combine, timestamp, colorize, uncolorize } = format;

// Fix 1: Access process.env directly instead of requiring config
const env = process.env.NODE_ENV || 'development';

// Fix 2: Add return statement to printf function
const winstonFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts}: ${level}: ${stack || message}`;
});

const logger = createLogger({
  // Fix 3: Use directly accessed env variable
  level: env === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Fix 4: Properly order the format transformations
    env === 'development' ? colorize() : uncolorize(),
    winstonFormat,
  ),
  transports: [new transports.Console()],
});
module.exports = logger;
