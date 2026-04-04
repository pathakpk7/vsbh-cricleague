// Simple health check test for GitHub Actions
const request = require('supertest');
const app = require('./test-app');

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return basic server info', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.body).toHaveProperty('message', 'VSBH-CL Test Server');
  });
});
