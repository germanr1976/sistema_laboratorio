import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
    name: 'laboratorio-backend',
    level: isDevelopment ? 'debug' : 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    }),
});

export default logger;
