import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { getEvaluationPeriod } from '../api';

export default function SurveyPage() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(null);
  const [periodWarning, setPeriodWarning] = useState('');

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const res = await api.get(`/student/survey/${courseId}`);
        setData(res.data);
      } catch (err) {
        setError('No se pudo cargar la encuesta.');
      } finally {
        setLoading(false);
      }
    };
    loadSurvey();
  }, [courseId]);

  useEffect(() => {
    const loadPeriod = async () => {
      try {
        const periodData = await getEvaluationPeriod();
        setPeriod(periodData);
      } catch (err) {
        setPeriodWarning('No se pudo verificar el periodo de evaluación.');
      }
    };

    loadPeriod();
  }, []);

  const isPeriodActive = () => {
    if (!period) return false;
    if (!period.isActive) return false;
    if (!period.startDate || !period.endDate) return false;
    const today = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
    return today >= start && today <= end;
  };

  const handleChangeScore = (questionId, score) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!data) return;

    const periodValid = isPeriodActive();
    if (!periodValid) {
      setError('El periodo de evaluación no está activo.');
      return;
    }

    const unanswered = data.questions.filter(q => !scores[q.id]);
    if (unanswered.length > 0) {
      setError('Faltan campos obligatorios en la encuesta.');
      return;
    }

    try {
      setSending(true);
      const answers = data.questions.map(q => ({
        questionId: q.id,
        score: Number(scores[q.id])
      }));
      const res = await api.post(`/student/survey/${courseId}`, { answers });
      setMessage(res.data.message || 'Encuesta enviada.');
      // Refrescar para actualizar estado de "ya enviada"
      const refresh = await api.get(`/student/survey/${courseId}`);
      setData(refresh.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar la encuesta.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="page"><p>Cargando encuesta...</p></div>;
  if (!data) return <div className="page"><p>No hay datos para esta encuesta.</p></div>;

  const periodText = data.period
    ? `Periodo activo: ${data.period.start_date} al ${data.period.end_date}`
    : 'Sin periodo activo';

  const periodValid = isPeriodActive();

  return (
    <div className="page">
      <h2>Encuesta de Evaluación Docente</h2>
      <p className="subtitle">Expresa tu opinión sobre el desempeño académico y pedagógico.</p>
      <p className="helper-text">{periodText}</p>

      {!periodValid && (
        <div className="error-message">
          El periodo de evaluación no está activo actualmente
        </div>
      )}

      {periodWarning && <div className="error-message">{periodWarning}</div>}
      {data.reason && <div className="info">{data.reason}</div>}
      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      {!data.canAnswer && !data.alreadyAnswered && !data.period && (
        <div className="error">
          El periodo de evaluación no está activo actualmente. No puedes responder la encuesta.
        </div>
      )}

      <form onSubmit={handleSubmit} className="survey-form">
        {data.questions.map((q, index) => (
          <div key={q.id} className="question-block">
            <p>
              {index + 1}. {q.text}
            </p>
            <div className="scale">
              {[1, 2, 3, 4, 5].map(v => (
                <label key={v}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={v}
                    disabled={!data.canAnswer}
                    checked={scores[q.id] === v}
                    onChange={() => handleChangeScore(q.id, v)}
                  />
                  <span>{v}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        {data.canAnswer && (
          <button className="btn primary" type="submit" disabled={sending || !periodValid}>
            {sending ? 'Enviando...' : 'Enviar Encuesta'}
          </button>
        )}
      </form>

      <p className="helper-text">
        Tus respuestas son completamente anónimas. Ningún docente podrá ver tu identidad.
      </p>
    </div>
  );
}