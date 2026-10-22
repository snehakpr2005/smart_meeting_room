import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            message: "no token provided or invalid format"
        });
    }


    // const token = authHeader.split(" ")[1];
    // if (!token) {
    //     console.log("token needed");
    //     return res.status(401).json({
    //         message: "no token provided"
    //     })
    // }

    try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.ACCESS_TOKEN);
        req.user = decoded;
        next();
    }

    catch (err) {   
        return res.status(401).json({ message: err.message });
    }
}

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "access denies:insufficient permissions"
            });
        }
        next();
    }

}
