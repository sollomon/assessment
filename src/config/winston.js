const appRoot = require('app-root-path');
const winston = require('winston');

var options = {
    file: {
      level: 'silly',
      filename: `${appRoot}/src/logs/app.log`,
    //   format:winston.format.json,
      handleExceptions: true,
      json: true,
      maxsize: 5242880,
      maxFiles: 5,
      colorize: false,
    },
    console: {
      level: 'silly',
      handleExceptions: true,
      json: false,
      colorize: true,
    },
};
var logger = winston.createLogger({
    transports: [
      new winston.transports.File(options.file),
      new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

logger.stream = {
    write: function(message, encoding) {
      logger.info(message);
    },
};

module.exports = logger;