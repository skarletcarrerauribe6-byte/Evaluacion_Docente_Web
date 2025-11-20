import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

function Login({ onLogin }) {
  const [code, setCode] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code, dni, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        // Credenciales inválidas o error de autenticación
        setError(data.message || 'Credenciales inválidas');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    }
  };

    const passwordPlaceholder = {
    student: 'Apellido_2 dígitos de tu DNI',
    professor: 'Apellido_2 dígitos de tu DNI',
    admin: 'Contraseña segura asignada'
  };

  const identifierPlaceholder = {
    student: 'Ej: 2125000000',
    professor: 'Ingresa tu DNI',
    admin: 'Ingresa tu DNI'
  };

  const resetFields = (newRole) => {
    setRole(newRole);
    setCode('');
    setDni('');
    setPassword('');
    setError('');
  };

  return (
     <div className="content-card">
      <form onSubmit={handleSubmit} className="form">
        <label>
          Rol de acceso
          <select
            className="input"
            value={role}
            onChange={(e) => resetFields(e.target.value)}
          >
            <option value="student">Estudiante</option>
            <option value="professor">Profesor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>

        <label>
          {role === 'student' ? 'Código de matrícula' : 'DNI'}
          <input
            className="input"
            type="text"
            value={role === 'student' ? code : dni}
            onChange={(e) => {
              if (role === 'student') setCode(e.target.value);
              else setDni(e.target.value);
            }}
            placeholder={identifierPlaceholder[role]}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={passwordPlaceholder[role]}
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