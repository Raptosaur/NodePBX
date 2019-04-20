const sip = require('sip');
const digest = require('sip/digest');
const util = require('./util');

function SIPServer(config){
  this.config = config;
}

function rstring() {
  return Math.floor(Math.random()*1e6).toString();
}

SIPServer.prototype.start = function(){
  sip.start(this.config.options, (function(request) {
    try{
      switch(request.method){
        case "SUBSCRIBE":{
          sip.send(sip.makeResponse(request, 200, 'OK'));
          break;
        }
        case "REGISTER":{
          this.handleRegister(request);
          break;
        }
        case "INVITE":{
          this.handleInvite(request);
          break;
        }
        default:{
          sip.send(sip.makeResponse(request, 405, 'Method Not Allowed'));
          break;
        }
      }
    }catch(e){
      console.log(e);
      sip.send(sip.makeResponse(request, 500, 'Server Internal Error'));
    }
  }).bind(this));
}

SIPServer.prototype.handleInvite = function(request){
    var username = sip.parseUri(request.uri).user;
    var target = this.config.peers[username];

    if(!target){
      sip.send(sip.makeResponse(request, 404, 'Not Found'));
    }else if(target.type == 'user'){
      // Check if they are registered
      if(Array.isArray(target.contact) && target.contact.length > 0){
        sip.send(sip.makeResponse(request, 100, 'Trying'));
        let response = { ...request };
        response.contact = [{ uri: 'sip:elijah@localhost' }];
        console.log(response.contact);
        sip.send(sip.makeResponse(response, 180, 'Ringing'));
      } else {
        // We could have voicemail here in the future?
        sip.send(sip.makeResponse(request, 480, 'Not Logged In'));
      }
    }else if(target.type == 'trunk'){
      // if()
    }
}

SIPServer.prototype.handleRegister = function(request){
  let username = sip.parseUri(request.headers.to.uri).user;
  let target = this.config.peers[username];

  // We do not know this username, but let's pretend to for security
  if(!target || (target && target.type != 'user')){
    var session = { realm: this.config.realm };
    sip.send(
      digest.challenge(
        { realm: this.config.realm },
        sip.makeResponse(request, 401, 'Authentication Required')
      )
    );
  }else{
    target.session = target.session || { realm: this.config.realm };
    if(!digest.authenticateRequest(target.session, request, {
      user: username,
      password: target.password,
    })){
      sip.send(
        digest.challenge(
          target.session,
          sip.makeResponse(request, 401, 'Authentication Required')
        )
      );
    }else{
      target.contact = request.headers.contact;
      var response = sip.makeResponse(request, 200, 'Ok');
      response.headers.contact = [
        {
          ...request.headers.contact[0],
          params: { ...request.headers.contact[0].params, expires: 60 },
        },
      ];
      sip.send(response);
    }
  }
}

SIPServer.prototype.callPeer = function(peer){

}

module.exports = SIPServer;
