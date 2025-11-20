import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

function Login({ onLogin }) {
  const [code, setCode] = useState('');
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, dni })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.student);
      } else {
        // Credenciales inválidas o error de autenticación
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div>
      <h2>Inicio de Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Código de estudiante:
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              required 
            />
          </label>
        </div>
        <div>
          <label>
            DNI:
            <input 
              type="password" 
              value={dni} 
              onChange={(e) => setDni(e.target.value)} 
              required 
            />
          </label>
        </div>
        <button type="submit">Ingresar</button>
      </form>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Login;
