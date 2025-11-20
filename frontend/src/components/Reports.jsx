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

  return (
    <div className="content-card">
      <h2 className="section-title">Reporte de Evaluación Docente</h2>
      <p className="subtitle">Resultados agregados - Datos anónimos.</p>

      {data.length === 0 && <p className="helper-text">No hay evaluaciones registradas aún.</p>}

      <div className="reports-grid">
        {data.map(report => (
          <div key={report.courseId} className="report-card">
            <div className="report-title">Curso: {report.courseName}</div>
            <div className="report-subtitle">Promedio General: {report.avg_general || '-'} / 5</div>
            <div className="report-item">
              <span>Dominio del Tema</span>
              <span>{report.avg_p1}</span>    
            </div>
            <div className="report-item">
              <span>Claridad al Explicar</span>
              <span>{report.avg_p2}</span>
            </div>
            <div className="report-item">
              <span>Motivación al Estudiante</span>
              <span>{report.avg_p3 || '-'}</span>
            </div>
          </div>
        ))}
      </div>

      <button className="btn primary" style={{ width: '100%', marginTop: '12px' }} onClick={onBack}>
        Volver
      </button>
    </div>
  );
}

export default Reports;