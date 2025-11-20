import React from 'react';

function CourseList({ user, onLogout, onStartSurvey, onViewReports }) {
  return (
    <div className="content-card">
      <div className="section-header">
        <h2 className="section-title">Mis cursos</h2>
        <p className="subtitle">Selecciona un curso para responder la encuesta.</p>
      </div>

      <div className="courses-list">
        {user.courses.map((course, index) => (
          <div key={course.id} className="course-card">
            <div className="course-number">{index + 1}</div>
            <div className="course-info">
              <h3>{course.name}</h3>
              <p className="course-meta">{course.code}</p>
              <p className="course-meta">{course.teacher}</p>
              {course.responded && <span className="status-pill">Encuesta enviada</span>}
              {course.isSurveyActive === false && (
                <span className="status-pill warning">Encuesta inactiva</span>
              )}
            </div>
            <button
              className="btn primary"
              disabled={course.isSurveyActive === false || course.responded}
              onClick={() => onStartSurvey(course)}
            >
              {course.responded ? 'Completado' : 'Responder'}
            </button>
          </div>
        ))}
      </div>

    <div className="action-stack">
        <button className="btn primary" style={{ width: '100%' }} onClick={onViewReports}>
          Ver Reportes
        </button>
        <button className="btn ghost" style={{ width: '100%' }} onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default CourseList;