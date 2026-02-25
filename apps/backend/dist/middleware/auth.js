"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.signToken = signToken;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
function signToken(userId, role) {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, exports.JWT_SECRET, { expiresIn: '7d' });
}
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        req.userId = decoded.sub;
        req.userRole = decoded.role;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.userId || !req.userRole) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}
