import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import User from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import Patient from "../models/patient.model.js";

const auth = (role) => {
  return asyncHandler(async (req, res, next) => {
    try {
      // Try cookies first, then Authorization header
      let token = req.cookies.accessToken;
      
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        throw new apiError(401, "Access token required");
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      let user = await User.findById(decoded._id);
      
      if (!user) {
        user = await Patient.findById(decoded._id);
        if (!user) {
          throw new apiError(404, "User not found");
        }
      }

      if (role && role !== user.role) {
        throw new apiError(403, "Access denied - insufficient permissions");
      }

      req.user = user;
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired, please login again.' });
      }
      next(err);
    }
  });
};

export default auth;