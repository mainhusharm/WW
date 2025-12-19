const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header (support multiple token formats)
    const token = req.header('x-auth-token') || 
                  req.header('Authorization')?.replace('Bearer ', '') ||
                  req.query.token;

    // Check if not token
    if (!token) {
        return res.status(401).json({ 
            msg: 'No token, authorization denied',
            error: 'Authentication required',
            code: 'NO_TOKEN'
        });
    }

    // Verify token
    try {
        const secret = process.env.CS_JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, secret);
        req.agent = decoded.agent;
        next();
    } catch (err) {
        console.error('JWT verification error:', err.message);
        res.status(401).json({ 
            msg: 'Token is not valid',
            error: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
        });
    }
};
