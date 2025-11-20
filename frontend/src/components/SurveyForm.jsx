import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getEvaluationPeriod } from '../api';

function SurveyForm({ course, user, onSubmitSurvey, onClose }) {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [p3, setP3] = useState(0);
  const [p4, setP4] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [period, setPeriod] = useState(null);
  const [periodError, setPeriodError] = useState('');
  const [periodLoading, setPeriodLoading] = useState(true);

  useEffect(() => {
    const loadPeriod = async () => {
      try {
        const periodResponse = await getEvaluationPeriod();
        setPeriod(periodResponse);
      } catch (err) {
        setPeriodError('No se pudo verificar el periodo de evaluación.');
      } finally {
        setPeriodLoading(false);
      }
    };

    loadPeriod();
  }, []);

  const isPeriodValid = () => {
    if (!period) return false;
    if (!period.isActive) return false;
    if (!period.startDate || !period.endDate) return false;
    const today = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return today >= start && today <= end;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (course.isSurveyActive === false) {
      setError('La encuesta de este curso ha sido desactivada.');
      return;
    }
    if (!isPeriodValid()) {
      setError('El periodo de evaluación no está activo.');
      return;
    }
    if (p1 === 0 || p2 === 0 || p3 === 0 || p4 === 0) {
      setError('Faltan campos obligatorios en encuesta.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: user.code,
          courseId: course.id,
          answers: { p1, p2, p3, p4, comment }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessOpen(true);
        onSubmitSurvey(course.id);
      } else {
        setError(data.message || 'Error al enviar la encuesta');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor');
    } finally {
      setSending(false);
    }
  };

  const periodIsValid = isPeriodValid();
  const showPeriodWarning = !periodLoading && !periodIsValid;

  return (
    <>
      <div className="content-card">
        <h2 className="section-title">Encuesta de Evaluación Docente</h2>
        <p className="subtitle">Evalúa el curso de {course.name} - {course.teacher}</p>

        {showPeriodWarning && (
          <div className="error-message" style={{ marginBottom: '10px' }}>
            El periodo de evaluación no está activo actualmente
          </div>
        )}

        {periodError && (
          <div className="error-message" style={{ marginBottom: '10px' }}>{periodError}</div>
        )}

        {course.isSurveyActive === false && (
          <div className="error-message" style={{ marginBottom: '10px' }}>
            El administrador desactivó temporalmente esta encuesta.
          </div>
        )}

        {error && <div className="error-message" style={{ marginBottom: '10px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="form">
          <div className="question-card">
            <div className="question-title">
              <span className="question-number">1</span>
              <p>¿El docente explica con claridad los temas del curso?</p>
            </div>
            <div className="scale">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={`p1-op${n}`}>
                  <input
                    type="radio"
                    name="p1"
                    value={n}
                    checked={p1 === n}
                    onChange={() => setP1(n)}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-card">
            <div className="question-title">
              <span className="question-number">2</span>
              <p>¿El docente fomenta la participación de los estudiantes?</p>
            </div>
            <div className="scale">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={`p2-op${n}`}>
                  <input
                    type="radio"
                    name="p2"
                    value={n}
                    checked={p2 === n}
                  onChange={() => setP2(n)}
                />
                <span>{n}</span>
              </label>
              ))}
            </div>
          </div>

          <div className="question-card">
            <div className="question-title">
              <span className="question-number">3</span>
              <p>¿Cumple con los horarios establecidos para las clases?</p>
            </div>
            <div className="scale">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={`p3-op${n}`}>
                  <input
                    type="radio"
                    name="p3"
                    value={n}
                    checked={p3 === n}
                    onChange={() => setP3(n)}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question-card">
            <div className="question-title">
              <span className="question-number">4</span>
              <p>¿El docente demuestra dominio del tema?</p>
            </div>
            <div className="scale">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={`p4-op${n}`}>
                  <input
                    type="radio"
                    name="p4"
                    value={n}
                    checked={p4 === n}
                    onChange={() => setP4(n)}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form" style={{ gap: '8px' }}>
            <label>
              Comentarios adicionales (opcional)
              <textarea
                className="textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn primary"
            disabled={!periodIsValid || sending}
          >
            {sending ? 'Enviando...' : 'Enviar Encuesta'}
          </button>
          <p className="helper-text">Tus respuestas son anónimas. Gracias por tu honestidad.</p>
        </form>
      </div>

      {successOpen && (
        <div className="overlay">
          <div className="modal">
            <h3>¡Encuesta enviada!</h3>
            <p>
              Gracias por participar en la evaluación docente.
              <br />
              Tu opinión ayuda a mejorar la calidad educativa.
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setSuccessOpen(false);
                onClose?.();
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SurveyForm;