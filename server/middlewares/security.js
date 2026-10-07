const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Helmet security configuration
 * Protects against common web vulnerabilities
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://vsbh-cl-backend.onrender.com", "https://qriibawpjsbazglbwohn.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Enable HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  
  // X-Content-Type-Options
  xContentTypeOptions: true
});

/**
 * Rate limiting configuration
 * Prevents brute force attacks and abuse
 */
const createRateLimit = (options = {}) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    ...options
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General rate limit for all requests
  general: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // Higher limit for general requests
  }),
  
  // Strict rate limit for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 login attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
      success: false,
      message: 'Too many login attempts, please try again later.'
    }
  }),
  
  // Rate limit for admin endpoints
  admin: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 admin requests per 15 minutes
    message: {
      success: false,
      message: 'Too many admin requests, please try again later.'
    }
  }),
  
  // Rate limit for auction operations
  auction: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 auction operations per minute
    message: {
      success: false,
      message: 'Too many auction requests, please slow down.'
    }
  }),
  
  // Rate limit for team creation
  teamCreation: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Generous limit for league administration
    message: {
      success: false,
      message: 'Team creation limit exceeded, please try again later.'
    }
  })
};

/**
 * Input size limits middleware
 * Prevents oversized payloads
 */
const inputSizeLimits = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB limit
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  next();
};

/**
 * Request timeout middleware
 * Prevents slowloris attacks
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout'
        });
      }
    }, timeout);
    
    // Clear timeout when response is sent
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    
    next();
  };
};

/**
 * Security headers middleware
 * Adds additional security headers
 */
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('Server');
  
  next();
};

/**
 * IP whitelist middleware for admin endpoints
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

module.exports = {
  helmetConfig,
  rateLimits,
  inputSizeLimits,
  requestTimeout,
  securityHeaders,
  ipWhitelist
};
