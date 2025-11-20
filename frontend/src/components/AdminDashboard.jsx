import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, getEvaluationPeriod, updateEvaluationPeriod } from '../api';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9'];

const AdminDashboard = ({ onBack }) => {
  const [period, setPeriod] = useState({ startDate: '', endDate: '', isActive: true });
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [periodData, coursesRes, reportsRes] = await Promise.all([
          getEvaluationPeriod(),
          fetch(`${API_BASE_URL}/admin/courses`).then(res => res.json()),
          fetch(`${API_BASE_URL}/api/reports`).then(res => res.json())
        ]);
        setPeriod(periodData);
        setCourses(coursesRes);
        setReports(reportsRes);
      } catch (err) {
        setError('No se pudieron cargar los datos de administración.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePeriodChange = (field, value) => {
    setPeriod(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePeriod = async (e) => {
    e.preventDefault();
    setSavingPeriod(true);
    setMessage('');
    setError('');
    try {
      const res = await updateEvaluationPeriod({
        startDate: period.startDate,
        endDate: period.endDate,
        isActive: period.isActive,
        role: 'admin'
      });
      setPeriod(res.evaluationPeriod);
      setMessage('Periodo actualizado correctamente');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el periodo');
    } finally {
      setSavingPeriod(false);
    }
  };

  const toggleCourse = async (courseId, currentState) => {
    setError('');
    try {
      await fetch(`${API_BASE_URL}/admin/course-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, isActive: !currentState })
      });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, isSurveyActive: !currentState } : c));
      setReports(prev => prev.map(r => r.courseId === courseId ? { ...r, isSurveyActive: !currentState } : r));
    } catch (err) {
      setError('No se pudo actualizar el estado de la encuesta.');
    }
  };

  const barDataByCourse = useMemo(() => {
    return reports.map(r => ([
      { name: 'Claridad', value: r.avg_p1 || 0 },
      { name: 'Participación', value: r.avg_p2 || 0 },
      { name: 'Puntualidad', value: r.avg_p3 || 0 },
      { name: 'Dominio', value: r.avg_p4 || 0 }
    ]));
  }, [reports]);

  if (loading) {
    return <div className="content-card">Cargando panel de administración...</div>;
  }

  return (
    <div className="content-card">
      <div className="section-header">
        <h2 className="section-title">Panel del Administrador</h2>
        <p className="subtitle">Gestiona las fechas, activa/desactiva encuestas y revisa los resultados.</p>
      </div>

      <section className="admin-section">
        <h3>Periodo de evaluación</h3>
        <form onSubmit={handleSavePeriod} className="form" style={{ marginTop: '8px' }}>
          <div className="row">
            <label style={{ flex: 1 }}>
              Fecha de inicio
              <input
                className="input"
                type="date"
                value={period.startDate}
                onChange={(e) => handlePeriodChange('startDate', e.target.value)}
                required
              />
            </label>
            <label style={{ flex: 1 }}>
              Fecha de fin
              <input
                className="input"
                type="date"
                value={period.endDate}
                onChange={(e) => handlePeriodChange('endDate', e.target.value)}
                required
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={period.isActive}
              onChange={(e) => handlePeriodChange('isActive', e.target.checked)}
            />
            Periodo activo
          </label>
          <button className="btn primary" type="submit" disabled={savingPeriod}>
            {savingPeriod ? 'Guardando...' : 'Guardar periodo'}
          </button>
          {message && <div className="success" style={{ marginTop: '8px' }}>{message}</div>}
          {error && <div className="error-message" style={{ marginTop: '8px' }}>{error}</div>}
        </form>
      </section>

      <section className="admin-section">
        <h3>Control de encuestas por curso</h3>
        <div className="courses-list" style={{ marginTop: '8px' }}>
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-info">
                <h4>{course.name}</h4>
                <p className="course-meta">{course.teacher}</p>
                <p className="course-meta">Matrícula: {course.enrolled}</p>
              </div>
              <button
                className="btn primary"
                onClick={() => toggleCourse(course.id, course.isSurveyActive)}
              >
                {course.isSurveyActive ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h3>Resultados por curso</h3>
        <p className="subtitle">Promedios por pregunta y participación registrada.</p>
        <div className="reports-grid">
          {reports.map((report, index) => (
            <div key={report.courseId} className="report-card">
              <div className="report-title">{report.courseName}</div>
              <div className="report-subtitle">{report.teacher}</div>
              <p className="helper-text">Estado: {report.isSurveyActive ? 'Activo' : 'Inactivo'}</p>
              <div style={{ height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={barDataByCourse[index]} margin={{ top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#4f46e5" name="Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Encuestas enviadas', value: report.count },
                        { name: 'Alumnos sin responder', value: Math.max(report.enrolled - report.count, 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label
                    >
                      {[0, 1].map(i => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="report-subtitle">Participación: {report.participationRate}%</p>
            </div>
          ))}
        </div>
      </section>

      <button className="btn ghost" style={{ width: '100%' }} onClick={onBack}>
        Cerrar sesión
      </button>
    </div>
  );
};

export default AdminDashboard;