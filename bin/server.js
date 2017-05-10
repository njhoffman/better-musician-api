if (process.env.NODE_ENV !== 'production') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json$)/i
  })) {
    return;
  }
}
require('../lib/utils/server.babel'); // babel registration (runtime transpilation for node)
require('../lib/server').initApp();
