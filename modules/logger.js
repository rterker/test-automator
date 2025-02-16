const logger = {
  log: function(message, path, type = 'INFO') {
    const entry = { 
      time: new Date().toLocaleString(),
      type,
      message,
      path
    };

    // if (type === 'INFO') {
    //   console.log('time: ', entry.time);
    //   console.log('path: ', entry.path);
    //   console.log('type: ', entry.type);
    //   console.log('message: ', entry.message);
    //   console.log('============================================');
    // }
    // if (type === 'ERROR') {
    //   console.error('time: ', entry.time);
    //   console.error('path: ', entry.path);
    //   console.error('type: ', entry.type);
    //   console.error('message: ', entry.message);
    //   console.error('============================================');
    // }
  }
};

const ERROR = 'ERROR';

export {
  logger,
  ERROR
};