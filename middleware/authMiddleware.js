import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === "string" ? authHeader.match(/^Bearer\s+(\S+)$/i) : null;
    if (!match) {
        return res.status(401).json({
            message: "A valid Bearer token is required"
        });
    }

    try {
        const decoded = jwt.verify(match[1], process.env.ACCESS_TOKEN);
        if (
            typeof decoded.userId !== "string" ||
            !["employee", "admin", "facility_manager"].includes(decoded.role)
        ) {
            return res.status(401).json({
                message: "Invalid access token"
            });
        }
        req.user = decoded;
        return next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired access token" });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions"
            });
        }
        return next();
    };
};
