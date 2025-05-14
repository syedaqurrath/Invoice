import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginUrl = `${API_URL}/auth/login`;
    const loginData = {
      email: email.trim().toLowerCase(),
      password: password
    };

    try {
      console.log('Attempting login with:', { url: loginUrl, email: loginData.email });
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', {
        success: response.ok,
        status: response.status,
        data: { ...data, token: data.token ? '[exists]' : '[none]' }
      });

      if (response.ok) {
        console.log('Login successful, saving token and redirecting');
        login(data.token);
        navigate('/dashboard');
      } else {
        const errorMessage = data.message || 'Login failed. Please check your credentials.';
        console.log('Login failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Login request failed:', error);
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && (
        <div className="error-message" onClick={() => setError('')}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className={error ? 'error' : ''}
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className={error ? 'error' : ''}
            minLength={6}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading || !email || !password}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="auth-link">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
