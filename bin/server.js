/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json$)/i
  })) {
    return;
  }
}
/* eslint-enable global-require */
require('../lib/utils/server.babel'); // babel registration (runtime transpilation for node)
require('../lib/server')();
