const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Ruta absoluta al archivo de datos para evitar dependencias del directorio de ejecución
const DATA_FILE = path.join(__dirname, 'data.json');

// Cargar datos iniciales (simulando la base de datos)
let data = JSON.parse(fs.readFileSync(DATA_FILE));

// Permite refrescar los datos cuando el archivo JSON se actualiza manualmente
const reloadData = () => {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (err) {
    console.error('No se pudo recargar data.json', err);
  }
};

const persistData = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error al guardar datos:', err);
  }
};

const getCoursesIndex = () => {
  const index = {};
  data.students.forEach(student => {
    student.courses.forEach(course => {
      if (!index[course.id]) {
        index[course.id] = {
          id: course.id,
          name: course.name,
          teacher: course.teacher,
          code: course.code,
          isSurveyActive: course.isSurveyActive !== false,
          enrolled: 0
        };
      }
      index[course.id].enrolled += 1;
    });
  });

  data.professors?.forEach(prof => {
    prof.courses.forEach(course => {
      if (!index[course.id]) {
        index[course.id] = {
          id: course.id,
          name: course.name,
          teacher: prof.name,
          code: course.code,
          isSurveyActive: course.isSurveyActive !== false,
          enrolled: 0
        };
      } else if (!index[course.id].teacher) {
        index[course.id].teacher = prof.name;
      }
      index[course.id].isSurveyActive = course.isSurveyActive !== false;
    });
  });

  return index;
};

const isWithinEvaluationPeriod = (period) => {
  if (!period || !period.startDate || !period.endDate) return false;
  const today = new Date();
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return today >= start && today <= end;
};

// Ruta de autenticación (login) para estudiantes, profesores y administradores
app.post('/api/login', (req, res) => {
  const { role = 'student', code, dni, password } = req.body;

  // Siempre usar la versión más reciente del archivo para reflejar reemplazos manuales
  reloadData();

  if (role === 'student') {
    const student = data.students.find(s => s.code === code);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (student.dni !== password) {
      return res.status(401).json({ success: false, message: 'DNI incorrecto' });
    }

    // Construir objeto de respuesta sin datos sensibles y con estado de encuestas por curso
    const studentData = {
      role: 'student',
      code: student.code,
      name: student.name,
      courses: student.courses.map(course => {
        // verificar si este estudiante ya respondió la encuesta de este curso
        const responded = data.surveys.some(resp => resp.student === student.code && resp.courseId === course.id);
        return { ...course, responded };
      })
    };

    return res.json({ success: true, user: studentData });
  }

  if (role === 'professor') {
    const professor = data.professors.find(p => p.dni === dni);
    if (!professor) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (professor.password !== password) {
      return res.status(401).json({ success: false, message: 'DNI incorrecto' });
    }

    const professorData = {
      role: 'professor',
      dni: professor.dni,
      name: professor.name,
      courses: professor.courses
    };

    return res.json({ success: true, user: professorData });
  }

  if (role === 'admin') {
    const admin = data.admins?.find(a => a.dni === dni);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (admin.password !== password) {
      return res.status(401).json({ success: false, message: 'DNI incorrecto' });
    }

    const adminData = {
      role: 'admin',
      dni: admin.dni,
      name: admin.name
    };

    return res.json({ success: true, user: adminData });
  }

  return res.status(400).json({ success: false, message: 'Rol no soportado' });
});

// Obtener el periodo de evaluación activo
app.get('/api/period', (req, res) => {
  reloadData();
  const evaluationPeriod = data.evaluationPeriod || { isActive: false };
  return res.json(evaluationPeriod);
});

// Actualizar el periodo de evaluación (solo admin simulado)
app.post('/api/period', (req, res) => {
  const { role, startDate, endDate, isActive } = req.body;
  reloadData();

  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }

  const updatedPeriod = {
    startDate,
    endDate,
    isActive: Boolean(isActive)
  };

  data.evaluationPeriod = updatedPeriod;

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error al guardar el periodo de evaluación', err);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar el periodo' });
  }

  return res.json({ success: true, evaluationPeriod: updatedPeriod });
});

// Listar todos los cursos con su estado de encuesta
app.get('/admin/courses', (req, res) => {
  reloadData();
  const courseIndex = getCoursesIndex();
  const courses = Object.values(courseIndex).map(c => ({
    id: c.id,
    name: c.name,
    teacher: c.teacher,
    code: c.code,
    isSurveyActive: c.isSurveyActive,
    enrolled: c.enrolled
  }));
  res.json(courses);
});

// Activar/desactivar encuestas por curso
app.post('/admin/course-status', (req, res) => {
  const { courseId, isActive } = req.body;
  reloadData();

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'courseId es obligatorio' });
  }

  const newStatus = Boolean(isActive);
  let updated = false;

  data.students.forEach(student => {
    student.courses.forEach(course => {
      if (course.id === courseId) {
        course.isSurveyActive = newStatus;
        updated = true;
      }
    });
  });

  data.professors?.forEach(prof => {
    prof.courses.forEach(course => {
      if (course.id === courseId) {
        course.isSurveyActive = newStatus;
        updated = true;
      }
    });
  });

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Curso no encontrado' });
  }

  persistData();

  return res.json({ success: true, courseId, isSurveyActive: newStatus });
});

// Ruta para envío de respuestas de una encuesta docente
app.post('/api/submit', (req, res) => {
  const { student: studentCode, courseId, answers } = req.body;
  reloadData();

  const evaluationPeriod = data.evaluationPeriod;
  if (!evaluationPeriod || evaluationPeriod.isActive === false) {
    return res.status(403).json({ success: false, message: 'El periodo de evaluación está cerrado' });
  }

  if (!isWithinEvaluationPeriod(evaluationPeriod)) {
    return res.status(403).json({ success: false, message: 'El periodo de evaluación está cerrado' });
  }

  if (!studentCode || !courseId || !answers) {
    return res.status(400).json({ success: false, message: 'Faltan datos de encuesta.' });
  }

  const requiredQuestions = ['p1', 'p2', 'p3', 'p4'];
  const parsedAnswers = {};

  const coursesIndex = getCoursesIndex();
  const course = coursesIndex[courseId];
  if (!course) {
    return res.status(404).json({ success: false, message: 'Curso no encontrado' });
  }

  if (course.isSurveyActive === false) {
    return res.status(403).json({ success: false, message: 'La encuesta para este curso está desactivada' });
  }

  for (const key of requiredQuestions) {
    const value = Number(answers[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Las respuestas deben estar entre 1 y 5.' });
    }
    parsedAnswers[key] = value;
  }

  const comment = typeof answers.comment === 'string' ? answers.comment.trim() : '';
  // Verificar si ya existe una respuesta de este estudiante para ese curso (solo una encuesta por curso)
  const already = data.surveys.find(resp => resp.student === studentCode && resp.courseId === courseId);
  if (already) {
    return res.status(400).json({ success: false, message: 'Ya enviaste una evaluación para este curso.' });
  }
  // Almacenar la nueva respuesta
  data.surveys.push({ student: studentCode, courseId, answers: { ...parsedAnswers, comment } });
  // Guardar en archivo JSON para persistencia
  persistData();
  res.json({ success: true, message: 'Encuesta guardada exitosamente' });
});

// Ruta para obtener reportes agregados de las evaluaciones
app.get('/api/reports', (req, res) => {
  reloadData();
  const courseInfo = getCoursesIndex();
  const summary = {};

  data.surveys.forEach(resp => {
    const { courseId: cid, answers } = resp;
    if (!summary[cid]) {
      summary[cid] = { count: 0, sum_p1: 0, sum_p2: 0, sum_p3: 0, sum_p4: 0, comments: [] };
    }
    summary[cid].count += 1;
    summary[cid].sum_p1 += Number(answers.p1) || 0;
    summary[cid].sum_p2 += Number(answers.p2) || 0;
    summary[cid].sum_p3 += Number(answers.p3) || 0;
    summary[cid].sum_p4 += Number(answers.p4) || 0;
    const sanitizedComment = typeof answers.comment === 'string' ? answers.comment.trim() : '';
    if (sanitizedComment !== '') {
      summary[cid].comments.push(sanitizedComment);
    }
  });
 
  const reportData = Object.keys(courseInfo).map(cid => {
    const agg = summary[cid] || { count: 0, sum_p1: 0, sum_p2: 0, sum_p3: 0, sum_p4: 0, comments: [] };
    const count = agg.count;
    const avg_p1 = count ? agg.sum_p1 / count : 0;
    const avg_p2 = count ? agg.sum_p2 / count : 0;
    const avg_p3 = count ? agg.sum_p3 / count : 0;
    const avg_p4 = count ? agg.sum_p4 / count : 0;
    const avg_general = count ? (agg.sum_p1 + agg.sum_p2 + agg.sum_p3 + agg.sum_p4) / (count * 4) : 0;
    const course = courseInfo[cid];
    return {
      courseId: cid,
      courseName: course?.name || cid,
      teacher: course?.teacher || '',
      code: course?.code,
      count,
      enrolled: course?.enrolled || 0,
      participationRate: course?.enrolled ? parseFloat(((count / course.enrolled) * 100).toFixed(2)) : 0,
      avg_p1: parseFloat(avg_p1.toFixed(2)),
      avg_p2: parseFloat(avg_p2.toFixed(2)),
      avg_p3: parseFloat(avg_p3.toFixed(2)),
      avg_p4: parseFloat(avg_p4.toFixed(2)),
      avg_general: parseFloat(avg_general.toFixed(2)),
      comments: agg.comments,
      isSurveyActive: course?.isSurveyActive !== false
    };
  });
  res.json(reportData);
});

// Reportes filtrados para docentes autenticados
app.get('/teacher/my-reports', (req, res) => {
  reloadData();
  const dni = req.headers['x-teacher-dni'] || req.query.dni;
  if (!dni) {
    return res.status(401).json({ success: false, message: 'DNI requerido' });
  }

  const professor = data.professors.find(p => p.dni === dni);
  if (!professor) {
    return res.status(403).json({ success: false, message: 'Docente no autorizado' });
  }

  const coursesIndex = getCoursesIndex();
  const allowedCourseIds = new Set(professor.courses.map(c => c.id));
  const summary = {};

  data.surveys.forEach(resp => {
    if (!allowedCourseIds.has(resp.courseId)) return;
    const { courseId: cid, answers } = resp;
    if (!summary[cid]) {
      summary[cid] = { count: 0, sum_p1: 0, sum_p2: 0, sum_p3: 0, sum_p4: 0 };
    }
    summary[cid].count += 1;
    summary[cid].sum_p1 += Number(answers.p1) || 0;
    summary[cid].sum_p2 += Number(answers.p2) || 0;
    summary[cid].sum_p3 += Number(answers.p3) || 0;
    summary[cid].sum_p4 += Number(answers.p4) || 0;
  });

  const reports = Array.from(allowedCourseIds).map(cid => {
    const course = coursesIndex[cid];
    const agg = summary[cid] || { count: 0, sum_p1: 0, sum_p2: 0, sum_p3: 0, sum_p4: 0 };
    const count = agg.count;
    const avg_p1 = count ? agg.sum_p1 / count : 0;
    const avg_p2 = count ? agg.sum_p2 / count : 0;
    const avg_p3 = count ? agg.sum_p3 / count : 0;
    const avg_p4 = count ? agg.sum_p4 / count : 0;
    const avg_general = count ? (agg.sum_p1 + agg.sum_p2 + agg.sum_p3 + agg.sum_p4) / (count * 4) : 0;
    return {
      courseId: cid,
      courseName: course?.name || cid,
      teacher: professor.name,
      count,
      enrolled: course?.enrolled || 0,
      participationRate: course?.enrolled ? parseFloat(((count / course.enrolled) * 100).toFixed(2)) : 0,
      avg_p1: parseFloat(avg_p1.toFixed(2)),
      avg_p2: parseFloat(avg_p2.toFixed(2)),
      avg_p3: parseFloat(avg_p3.toFixed(2)),
      avg_p4: parseFloat(avg_p4.toFixed(2)),
      avg_general: parseFloat(avg_general.toFixed(2)),
      isSurveyActive: course?.isSurveyActive !== false
    };
  });

  return res.json(reports);
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});