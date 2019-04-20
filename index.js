const sip = require('sip');
const digest = require('sip/digest');
const os = require('os');

const options = {
  port: 5070,
  address: '0.0.0.0',
  udp: true,
  tcp: true,
  publicAddress: 'localhost'
};

const realm = os.hostname();

var registry = {
  'elijah': { password: 'password1' },
  'steve': { password: 'password2' }
}

console.log('Starting NodePBX Server on '+options.address+':'+options.port+'...');
sip.start(options, function(request) {
  try{
    switch(request.method){
      case "SUBSCRIBE":{
        sip.send(sip.makeResponse(request, 200, 'OK'));
        break;
      }
      case "REGISTER":{
        let username = sip.parseUri(request.headers.to.uri).user;
        let userinfo = registry[username];

        // We do not know this username, but let's pretend to for security
        if(!userinfo){
          var session = { realm: realm };
          sip.send(
            digest.challenge(
              { realm: realm },
              sip.makeResponse(request, 401, 'Authentication Required')
            )
          );
        }else {
          userinfo.session = userinfo.session || { realm: realm };
          if(!digest.authenticateRequest(userinfo.session, request, {
            user: username,
            password: userinfo.password,
          })){
            sip.send(
              digest.challenge(
                userinfo.session,
                sip.makeResponse(request, 401, 'Authentication Required')
              )
            );
          }else{
            userinfo.contact = request.headers.contact;
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
        break;
      }
      case "INVITE":{
        var username = sip.parseUri(request.uri).user;
        var userinfo = registry[username];
        if (
          userinfo &&
          Array.isArray(userinfo.contact) &&
          userinfo.contact.length > 0
        ) {
          // If user is in
          sip.send(sip.makeResponse(request, 100, 'Trying'));
          let response = { ...request };
          response.contact = [{ uri: 'sip:elijah@localhost' }];
          console.log(response.contact);
          sip.send(sip.makeResponse(response, 180, 'Ringing'));
        } else {
          sip.send(sip.makeResponse(request, 404, 'Not Found'));
        }
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
});
