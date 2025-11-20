import React, { useState } from 'react';
import { API_BASE_URL } from '../api';

function SurveyForm({ course, user, onSubmitSurvey }) {
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (p1 === 0 || p2 === 0) {
      alert('Por favor responda todas las preguntas obligatorias');
      return;
    }
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
        alert('Encuesta enviada exitosamente');
        onSubmitSurvey(course.id);
      } else {
        alert(data.message || 'Error al enviar la encuesta');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="page-section">
      <h3>Evaluar al docente: {course.teacher} ({course.name})</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <p>1. ¿El docente demuestra puntualidad en las clases?</p>
          <div>
            {[1, 2, 3, 4, 5].map(n => (
              <label key={`p1-op${n}`} style={{ marginRight: '1em' }}>
                <input
                  type="radio"
                  name="p1"
                  value={n}
                  checked={p1 === n}
                  onChange={() => setP1(n)}
                />
                {n}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p>2. ¿El docente explica claramente los conceptos?</p>
          <div>
            {[1, 2, 3, 4, 5].map(n => (
              <label key={`p2-op${n}`} style={{ marginRight: '1em' }}>
                <input
                  type="radio"
                  name="p2"
                  value={n}
                  checked={p2 === n}
                  onChange={() => setP2(n)}
                />
                {n}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p>Comentarios adicionales (opcional):</p>
          <textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            rows="3" 
            cols="40" 
          />
        </div>
        <button type="submit">Enviar Encuesta</button>
      </form>
    </div>
  );
}

export default SurveyForm;
