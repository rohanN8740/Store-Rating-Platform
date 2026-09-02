// Role-based authorization middleware

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};

export const requireAdmin = requireRole("ADMIN");
export const requireUser = requireRole("USER");
export const requireStoreOwner = requireRole("STORE_OWNER");
export const requireAdminOrOwner = requireRole("ADMIN", "STORE_OWNER");
