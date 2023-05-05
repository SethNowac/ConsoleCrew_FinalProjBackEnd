const pino = require('pino');
const transport = pino.transport({
    targets: [
        {
            level: "trace", // for this location, always support trace
            target: "pino/file", // logs to standard output
            options: {destination: "logs/server-log"}, // logs to file
        },
        {
            level: "trace", // for this location, always support trace
            target: "pino/file", // logs to standard output
        },
    ]
});

const logger = pino(
    {
        level: "warn", // minimum level to log
    },
    transport
);

module.exports = logger