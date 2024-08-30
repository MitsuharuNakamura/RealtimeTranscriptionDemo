exports.handler = function(context, event, callback) {
    const AccessToken = Twilio.jwt.AccessToken;
    const SyncGrant = AccessToken.SyncGrant;

    const syncGrant = new SyncGrant({
        serviceSid: context.SYNC_SERVICE_SID
    });

    const identity = 'clientUser'; // クライアントの識別子
    const token = new AccessToken(
        context.ACCOUNT_SID,
        context.API_KEY,
        context.API_SECRET,
        { identity: identity }  // identityをここで指定
    );

    token.addGrant(syncGrant);

    const response = new Twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setBody({
        token: token.toJwt()
    });

    callback(null, response);
};