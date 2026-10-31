const { createHmac } = require('node:crypto');
function pseudonymize(secret, reporterId, ipPrefix) {
    if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32)
        throw new Error('REPORTER_HMAC_SECRET must contain at least 32 bytes');
    if (typeof reporterId !== 'string' || !reporterId || typeof ipPrefix !== 'string' || !ipPrefix)
        throw new Error('Identity signals are required');
    const digest = (purpose, value) => createHmac('sha256', secret).update(purpose + '\0' + value).digest('hex');
    return { reporterHmac: digest('reporter_id', reporterId), ipPrefixHmac: digest('ip_prefix', ipPrefix) };
}
module.exports = { pseudonymize };
