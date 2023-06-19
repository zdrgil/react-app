import request from 'supertest';
import { app } from '../index';

describe('API Endpoint Tests', () => {
  let api: request.SuperTest<request.Test>;
  let server: any;

  beforeAll(() => {
    server = app.listen();
    const port = server.address().port;
    api = request(`http://localhost:${port}`);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should login with valid credentials', async () => {
    const response = await api
      .post('/login')
      .send({
        username: 'admin',
        password: 'admin',
      });




    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  }, 10000);


  it('should register a new user', async () => {
    const response = await api
      .post('/login/public-users')
      .send({
        username: 'zdrg',
        password: 'zdrg',
      });
  
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');

  });
  


  

  // 添加更多测试用例...
});