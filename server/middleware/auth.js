const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    if (!req.user.role) {
      req.user.role = "Headmaster"; // Fallback for old session tokens
    } else {
      req.user.role = req.user.role.toUpperCase();
    }

    if (
      req.user.requiresPasswordChange &&
      !req.path.endsWith("/change-password")
    ) {
      return res.status(403).json({ error: "Password change required" });
    }

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authenticate;
