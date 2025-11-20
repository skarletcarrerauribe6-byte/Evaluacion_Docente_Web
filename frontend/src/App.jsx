import React, { useState } from 'react';
import Login from './components/Login';
import CourseList from './components/CourseList';
import SurveyForm from './components/SurveyForm';
import Reports from './components/Reports';

function App() {
  const [user, setUser] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [page, setPage] = useState('login');

  const headers = {
  login: {
    title: 'Evaluación Docente - FIIS UNAC',
    subtitle: 'Accede con tu código de matrícula o DNI'
  },
  courses: {
    title: 'Evaluación Docente - FIIS UNAC',
    subtitle: 'Accede con tu código de matrícula o DNI'
  },
  survey: {
    title: 'Encuesta de Evaluación Docente',
    subtitle: 'Expresa tu opinión sobre el desempeño académico y pedagógico'
  },
  report: {
    title: 'Reporte de Evaluación Docente',
    subtitle: 'Resultados agregados - Datos anónimos'
  }
};

  const handleLogin = (studentData) => {
    setUser(studentData);
    setPage('courses');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentCourse(null);
    setPage('login');
  };

  const startSurvey = (course) => {
    setCurrentCourse(course);
    setPage('survey');
  };

  const submitSurvey = (courseId) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const updatedCourses = prevUser.courses.map(c =>
        c.id === courseId ? { ...c, responded: true } : c
      );
      return { ...prevUser, courses: updatedCourses };
    });
  };

  const goBackToCourses = () => {
    setCurrentCourse(null);
    setPage('courses');
  };

  const renderLayout = (key, content) => {
    const header = headers[key];
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <header className="hero">
            <h1>{header?.title}</h1>
            {header?.subtitle && <p>{header.subtitle}</p>}
          </header>
          <div className="card-body">
            {content}
            <p className="footer-note">© FIIS UNAC - Sistema de Evaluación Docente</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {page === 'login' && renderLayout('login', <Login onLogin={handleLogin} />)}
      {page === 'courses' && user &&
        renderLayout(
          'courses',
          <CourseList
            user={user}
            onLogout={handleLogout}
            onStartSurvey={startSurvey}
            onViewReports={() => setPage('report')}
          />
        )}
      {page === 'survey' && user && currentCourse &&
        renderLayout(
          'survey',
          <SurveyForm
            course={currentCourse}
            user={user}
            onSubmitSurvey={submitSurvey}
            onClose={goBackToCourses}
          />
        )}
      {page === 'report' &&
        renderLayout('report', <Reports onBack={() => setPage(user ? 'courses' : 'login')} />)}
    </>
  );
}

export default App;