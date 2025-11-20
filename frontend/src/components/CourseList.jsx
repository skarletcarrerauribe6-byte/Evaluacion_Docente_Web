function CourseList({ user, onLogout, onSelectCourse, onViewReports }) {
  return (
    <div>
      <h1>Bienvenido, {user.name}</h1>

      <div className="page-section">
        <h2>Tus Cursos Inscritos</h2>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Docente</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {user.courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.teacher}</td>
                  <td>{course.status}</td>
                  <td>
                    <button onClick={() => onSelectCourse(course)}>
                      Responder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="actions-row">
          <button className="btn-secondary" onClick={onLogout}>
            Cerrar Sesión
          </button>
          <button onClick={onViewReports}>Ver Reportes</button>
        </div>
      </div>
    </div>
  );
}
