# Admin API Testing Guide

## Setup

1. Start your server:
```bash
cd server
npm start
```

2. Set your admin key in `.env` file:
```
ADMIN_KEY=your_secure_admin_key_here
```

## API Endpoints

### 1. Admin Login
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"admin_key": "your_secure_admin_key_here"}'
```

### 2. Reset Auction System
```bash
curl -X POST http://localhost:5000/api/admin/reset \
  -H "Content-Type: application/json" \
  -H "admin_key: your_secure_admin_key_here"
```

## How Admin Login Works

### Simple Admin Key Method (Current)
- Uses a simple admin key stored in environment variables
- Admin key is passed in headers for authentication
- Default admin key is "admin123" if not set in .env

### How to Use:
1. Set `ADMIN_KEY` in your server's `.env` file
2. Use this key when making admin requests
3. Include the key in the `admin_key` header for protected endpoints

### Example Frontend Integration:
```javascript
// Login
const loginResponse = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ admin_key: 'your_admin_key' })
});

// Reset system (after login)
const resetResponse = await fetch('/api/admin/reset', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'admin_key': 'your_admin_key' 
  }
});
```

## Security Notes

- Change the default `ADMIN_KEY` in production
- Consider using JWT tokens for better security
- Add rate limiting to prevent brute force attacks
- Log admin actions for audit trails

## Testing

Use the provided `admin-test.html` file in your browser to test the admin functionality:
1. Open `server/admin-test.html`
2. Enter your admin key
3. Click "Login" to authenticate
4. Click "Reset System" to perform the reset (with confirmation)

The reset will:
- ✅ Delete all auction logs
- ✅ Delete all team players  
- ✅ Reset all players to unsold status
- ✅ Reset all team budgets to default (1 crore)
- ✅ Reset auction state to initial values
