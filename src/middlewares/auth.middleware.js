import { verifyToken } from '../utils/auth.util.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) res.status(401).json({
        success: false,
        data: null,
        message: 'No token provided'
    });
  
    try {
      const user = verifyToken(token);
      req.user = user;
      next();
    } catch (err) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Invalid token'
      });
    }
  };
  