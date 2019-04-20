const os = require('os');
const util = require('./util');
var config = module.exports = {};

config.options = {
  port: 5060,
  address: '0.0.0.0',
  udp: true,
  tcp: true,
  publicAddress: 'localhost',
  logger: {
    send: function(message, address) {
      util.log('[OUT]', message);
    },
    recv: function(message, address) {
      util.log('[INC]', message);
    }
  }
};

config.realm = os.hostname();

config.peers = {
  'elijah': {
    type: 'user',
    password: 'password1'
  },
  'steve': {
    type: 'user',
    password: 'password2'
  },
  '442039051010': {
    type: 'trunk',
    contacts: [
      {
        type: 'user',
        peer: 'elijah'
      }
    ]
  }
}
