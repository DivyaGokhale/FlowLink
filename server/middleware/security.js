import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { body, validationResult } from "express-validator";

// Rate limiting
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many cart operations.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
export const securityHeaders = [
  helmet(),
  xss(),
  hpp(),
  mongoSanitize(),
  (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' https:;"
    );
    next();
  },
];

// Validation
export const validateLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

export const validateCart = [
  body("productId").isMongoId(),
  body("quantity").isInt({ min: 1, max: 100 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
