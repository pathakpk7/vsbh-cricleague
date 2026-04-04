const request = require('supertest');
const app = require('./test-app');

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/admin/login', () => {
    it('should login with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ admin_key: 'admin123' })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Admin login successful');
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid admin credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({ admin_key: 'invalid' })
        .expect(401);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid admin key');
    });
  });

  describe('POST /api/admin/reset', () => {
    it('should reset auction system with valid admin key', async () => {
      const response = await request(app)
        .post('/api/admin/reset')
        .set('admin_key', 'admin123')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'System reset successful');
      expect(response.body).toHaveProperty('reset_operations');
    });

    it('should reject reset without admin key', async () => {
      const response = await request(app)
        .post('/api/admin/reset')
        .expect(403);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('GET /api/players', () => {
    it('should return players list', async () => {
      const response = await request(app)
        .get('/api/players')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/teams', () => {
    it('should return teams list', async () => {
      const response = await request(app)
        .get('/api/teams')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/auction/state', () => {
    it('should return auction state', async () => {
      const response = await request(app)
        .get('/api/auction/state')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('current_bid');
      expect(response.body.data).toHaveProperty('timer_seconds');
    });
  });
});
