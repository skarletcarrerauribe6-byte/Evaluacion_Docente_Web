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
     <div className="content-card">
      <form onSubmit={handleSubmit} className="form">
        <label>
          Código de matrícula / DNI
          <input
            className="input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: 2125000000 o 70000000"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            className="input"
            type="password"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn primary">
          Iniciar sesión
        </button>
        <p className="helper-text">
          ¿Olvidaste tu contraseña? <span className="link-text">Contacta al área de sistemas.</span>
        </p>
      </form>
    </div>
  );
}

export default Login;