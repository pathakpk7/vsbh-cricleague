# VSBH-CL Security Implementation Guide

## Overview

This document outlines the comprehensive security implementation for the VSBH Cricket League (VSBH-CL) web application. The security architecture follows industry best practices and defense-in-depth principles.

## Security Features Implemented

### 1. Input Validation & Sanitization

#### Frontend Validation
- **Real-time validation** using regex patterns
- **Field-level error messages** with accessibility support
- **Form submission prevention** when validation fails
- **Input sanitization** to prevent XSS attacks

#### Backend Validation
- **Joi validation schemas** for all API endpoints
- **Parameter validation** with type checking
- **Length limits** to prevent abuse
- **Custom validators** for business logic

### 2. XSS Protection

#### Client-Side
- **Input sanitization** using DOMPurify
- **HTML entity encoding** for user inputs
- **Content Security Policy** headers
- **Safe rendering** of dynamic content

#### Server-Side
- **XSS filtering middleware** using `xss` library
- **HTML tag stripping** for dangerous elements
- **Attribute sanitization** for event handlers
- **Recursive object sanitization**

### 3. SQL Injection Prevention

#### Database Security
- **Parameterized queries** using Supabase ORM
- **Input validation** before database operations
- **Type checking** for all parameters
- **Transaction safety** for complex operations

#### Query Examples
```javascript
// Safe parameterized query
const { data } = await supabase
  .from('players')
  .select('*')
  .eq('id', playerId)
  .single();

// Validated input before query
if (!/^[a-zA-Z0-9\-]+$/.test(playerId)) {
  throw new Error('Invalid player ID');
}
```

### 4. Authentication & Authorization

#### Admin Security
- **Constant-time comparison** for admin key validation
- **Rate limiting** for authentication attempts
- **Header-based authentication** (more secure than body)
- **Session management** with secure tokens

#### Access Control
- **Role-based permissions** for different user types
- **IP whitelisting** for admin endpoints
- **Request logging** for security monitoring
- **Failed attempt tracking**

### 5. Security Middleware

#### Helmet Configuration
```javascript
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
});
```

#### Rate Limiting
- **General rate limit**: 1000 requests per 15 minutes
- **Auth rate limit**: 5 attempts per 15 minutes
- **Admin rate limit**: 20 requests per 15 minutes
- **Auction rate limit**: 30 requests per minute

### 6. Error Handling

#### Centralized Error Handler
- **Consistent error responses** across all endpoints
- **Secure error messages** (no sensitive data leakage)
- **Request tracking** with unique IDs
- **Logging for security monitoring**

#### Error Response Format
```javascript
{
  "success": false,
  "message": "Error description",
  "errors": [...], // Validation errors
  "requestId": "unique-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Project Structure

```
server/
  middleware/           # Security middleware
    - validation.js     # Input validation
    - sanitization.js   # XSS protection
    - security.js       # Helmet & rate limiting
    - errorHandler.js  # Centralized error handling
  
  validators/           # Joi validation schemas
    - authValidator.js # Authentication schemas
  
  utils/              # Security utilities
    - secureQueries.js # Safe database operations
    - logger.js       # Security logging
  
  routes/             # Protected API routes
    - admin.js        # Admin endpoints with security
    - teams.js        # Team management
    - players.js      # Player operations
    - auction.js      # Auction system
```

## Security Best Practices

### 1. Input Validation Rules

#### Name Fields
- **Pattern**: `/^[a-zA-Z\s\-',.]{2,50}$/`
- **Allowed**: Letters, spaces, hyphens, apostrophes, periods
- **Length**: 2-50 characters

#### Email Fields
- **Pattern**: Standard email regex
- **Length**: Maximum 100 characters
- **Validation**: Real-time format checking

#### ID Fields
- **Pattern**: `/^[a-zA-Z0-9\-_]+$/`
- **Purpose**: Prevent injection in database queries
- **Usage**: All database identifiers

### 2. Database Security

#### Query Safety
- **Never use string concatenation** in queries
- **Always validate input** before database operations
- **Use parameterized queries** exclusively
- **Implement transaction safety** for complex operations

#### Data Validation
```javascript
// Example of safe player creation
async createPlayer(playerData) {
  // Validate required fields
  if (!playerData.name || playerData.name.trim() === '') {
    throw new Error('Name is required');
  }
  
  // Sanitize and validate
  const sanitizedData = {
    name: playerData.name.trim().substring(0, 100),
    role: validRoles.includes(playerData.role) ? playerData.role : 'Batsman',
    base_price: Math.max(100, Math.min(100000, parseInt(playerData.base_price) || 100))
  };
  
  // Safe database operation
  const { data, error } = await supabase
    .from('players')
    .insert([sanitizedData])
    .select();
}
```

### 3. Authentication Security

#### Admin Authentication
- **Constant-time comparison** prevents timing attacks
- **Rate limiting** prevents brute force attacks
- **Header-based keys** more secure than body
- **Request logging** for monitoring

#### Session Management
- **Secure token generation** using crypto
- **Token expiration** for session timeout
- **Logout functionality** for session termination
- **Secure storage** of session data

### 4. Frontend Security

#### Form Validation
- **Real-time validation** with immediate feedback
- **Accessibility support** with ARIA attributes
- **Visual error indicators** for user feedback
- **Form submission prevention** on validation errors

#### XSS Prevention
- **Input sanitization** before rendering
- **HTML entity encoding** for user content
- **Safe DOM manipulation** practices
- **Content Security Policy** enforcement

## Security Headers

### HTTP Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Content Security Policy
```
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https:
connect-src 'self' https://api.example.com
```

## Rate Limiting Configuration

### Rate Limits by Endpoint
- **General**: 1000 requests/15min
- **Authentication**: 5 attempts/15min
- **Admin**: 20 requests/15min
- **Auction**: 30 requests/minute
- **Team Creation**: 3 teams/hour

### Rate Limit Response
```javascript
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

## Monitoring & Logging

### Security Events Logged
- **Authentication attempts** (success/failure)
- **Admin access** with IP tracking
- **Rate limit violations**
- **Validation failures**
- **Database errors** (sanitized)

### Log Format
```javascript
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "security",
  "event": "admin_login_attempt",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "success": false,
  "reason": "invalid_admin_key"
}
```

## Testing Security

### Security Tests
- **Input validation testing** with malicious inputs
- **XSS testing** with script injection attempts
- **SQL injection testing** with malicious queries
- **Rate limiting testing** with rapid requests
- **Authentication testing** with brute force attempts

### Test Cases
```javascript
// XSS test
const xssPayload = '<script>alert("xss")</script>';
const sanitized = sanitizeInput(xssPayload);
// Should return: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

// SQL injection test
const maliciousId = "'; DROP TABLE players; --";
const isValid = /^[a-zA-Z0-9\-]+$/.test(maliciousId);
// Should return: false
```

## Deployment Security

### Environment Variables
```bash
# Required security variables
ADMIN_KEY=your-secure-admin-key
JWT_SECRET=your-jwt-secret-key
DATABASE_URL=secure-database-connection
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Production Checklist
- [ ] All environment variables set
- [ ] HTTPS enabled with valid certificates
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Error handling configured
- [ ] Logging enabled
- [ ] Database access secured
- [ ] CORS properly configured

## Security Maintenance

### Regular Security Tasks
1. **Update dependencies** for security patches
2. **Review logs** for suspicious activity
3. **Test security measures** regularly
4. **Audit code** for new vulnerabilities
5. **Update validation rules** as needed
6. **Monitor rate limits** effectiveness
7. **Review authentication** logs

### Security Updates
- **Monthly dependency updates**
- **Quarterly security audits**
- **Annual penetration testing**
- **Immediate patching** for critical vulnerabilities

## Contact & Support

For security-related issues:
- **Security Team**: security@vsbh-cl.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Bug Bounty**: security@vsbh-cl.com
- **Documentation**: https://docs.vsbh-cl.com/security

---

**Last Updated**: April 2026  
**Version**: 1.0.0  
**Security Level**: Production Ready
