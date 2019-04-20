const config = require('./config');
const SIPServer = require('./SIPServer');
const util = require('./util');

util.log(
  'Starting NodePBX Server on', config.options.address+':'+config.options.port
);

var sipServer = new SIPServer(config);
sipServer.start();
