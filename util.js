var util = module.exports = {};

util.log = function(...args){
  console.log('['+new Date().toISOString()+']', ...args);
}
