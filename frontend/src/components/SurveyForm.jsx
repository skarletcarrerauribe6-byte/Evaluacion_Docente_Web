import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

function SurveyForm({ course, user, onSubmitSurvey, onClose }) {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (p1 === 0 || p2 === 0) {
      setError('Faltan campos obligatorios en encuesta.');
      return;
    }
    setError('');
    try {
        const res = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: user.code,
          courseId: course.id,
          answers: { p1, p2, comment }
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
    }
  };

  return (
    <>
      <div className="content-card">
        <h2 className="section-title">Encuesta de Evaluación Docente</h2>
        <p className="subtitle">Evalúa el curso de {course.name} - {course.teacher}</p>

        {error && <div className="error" style={{ marginBottom: '10px' }}>{error}</div>}

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

          <button type="submit" className="btn primary">Enviar Encuesta</button>
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
