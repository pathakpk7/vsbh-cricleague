import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    name: '',
    universityId: '',
    cricHeroesId: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(credentials);
    
    if (success) {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-title">
            <img src="/logo_vsbh.png" alt="VSBH-CL" className="login-logo" />
            <h1>VSBH-CL</h1>
          </div>
          <h2>Login</h2>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={credentials.name}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="universityId">University ID</label>
            <input
              type="text"
              id="universityId"
              name="universityId"
              value={credentials.universityId}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your university ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cricHeroesId">CricHeroes ID</label>
            <input
              type="text"
              id="cricHeroesId"
              name="cricHeroesId"
              value={credentials.cricHeroesId}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your CricHeroes ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email ID</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              className="form-control"
              placeholder="Enter your email ID"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || isLoading}>
            {loading || isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>Welcome to VSBH Cricket League!</p>
          <p>For support: prasoon7pathak@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
