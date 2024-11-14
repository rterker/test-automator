const logger = {
  log: function(message, path, type = 'INFO') {
    const entry = { 
      time: new Date().toLocaleString(),
      type,
      message,
      path
    };

    if (type === 'INFO') console.log(entry);
    if (type === 'ERROR') console.error(entry);
  }
};

const ERROR = 'ERROR';

export {
  logger,
  ERROR
};