const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../tokenSchema');

const authenticationToken = async(req, res, next)=>{
    const token = req.headers.authorization.split(' ')[1];
    const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ message: 'Token is blacklisted' });
        }
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    })
}
module.exports = authenticationToken;