import { tokenService } from "../services/tokenService.js";

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    try {
        const decoded = tokenService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ valid: false, message: 'Invalid token' });
    }
};

export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // If no roles specified, just check if user is authenticated
        if (roles.length === 0) {
            return next();
        }

        // Check if user has required role
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions'
            });
        }

        next();
    };
};