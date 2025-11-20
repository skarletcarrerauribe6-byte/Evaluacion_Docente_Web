import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';

function Reports({ onBack }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reports`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error(err));
  }, []);

  if (data.length === 0) {
    return (
      <div>
        <h3>Reportes de Evaluaciones</h3>
        <p>No hay evaluaciones registradas aún.</p>
        <button onClick={onBack}>Volver</button>
      </div>
    );
  }

  return (
    <div className="page-section">
      <h3>Reportes de Evaluaciones</h3>
      {data.map(report => (
        <div key={report.courseId} style={{ marginBottom: '1em', padding: '0.5em', border: '1px solid #ccc' }}>
          <h4>{report.courseName} – Prof. {report.teacher}</h4>
          <p>Respuestas recibidas: {report.count}</p>
          <p>Promedio Pregunta 1: {report.avg_p1} / 5</p>
          <p>Promedio Pregunta 2: {report.avg_p2} / 5</p>
          {report.comments.length > 0 ? (
            <div>
              <p>Comentarios:</p>
              <ul>
                {report.comments.map((c, idx) => <li key={idx}>{c}</li>)}
              </ul>
            </div>
          ) : (
            <p>Comentarios: (sin comentarios)</p>
          )}
        </div>
      ))}
      <button onClick={onBack}>Volver</button>
    </div>
  );
}

export default Reports;
