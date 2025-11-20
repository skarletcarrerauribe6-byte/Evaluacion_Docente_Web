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

// Ruta de autenticación (login) para estudiantes, profesores y administradores
app.post('/api/login', (req, res) => {
  const { role = 'student', code, dni, password } = req.body;

  // Siempre usar la versión más reciente del archivo para reflejar reemplazos manuales
  reloadData();

  if (role === 'student') {
    const student = data.students.find(s => s.code === code && s.password === password);
    if (!student) {
      return res.status(401).json({ success: false, message: 'Código o contraseña incorrecto' });
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
    const professor = data.professors.find(p => p.dni === dni && p.password === password);
    if (!professor) {
      return res.status(401).json({ success: false, message: 'DNI o contraseña incorrecto' });
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
    const admin = data.admins?.find(a => a.dni === dni && a.password === password);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'DNI o contraseña incorrecto' });
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

// Ruta para envío de respuestas de una encuesta docente
app.post('/api/submit', (req, res) => {
  const { student: studentCode, courseId, answers } = req.body;
    reloadData();
  // Verificar si ya existe una respuesta de este estudiante para ese curso (solo una encuesta por curso)
  const already = data.surveys.find(resp => resp.student === studentCode && resp.courseId === courseId);
  if (already) {
    return res.status(400).json({ success: false, message: 'Ya enviaste una evaluación para este curso.' });
  }
  // Almacenar la nueva respuesta
  data.surveys.push({ student: studentCode, courseId, answers });
  // Guardar en archivo JSON para persistencia
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error al guardar datos:', err);
  }
  res.json({ success: true, message: 'Encuesta guardada exitosamente' });
});

// Ruta para obtener reportes agregados de las evaluaciones
app.get('/api/reports', (req, res) => {
  const summary = {};
  // Recopilar información de cursos (nombre y profesor) para referencia
  const courseInfo = {};
  data.students.forEach(stu => {
    stu.courses.forEach(course => {
      courseInfo[course.id] = { name: course.name, teacher: course.teacher };
    });
  });
  // Agregar datos de cada respuesta registrada
  data.surveys.forEach(resp => {
    const cid = resp.courseId;
    if (!summary[cid]) {
      summary[cid] = { count: 0, sum_p1: 0, sum_p2: 0, comments: [] };
    }
    summary[cid].count += 1;
    summary[cid].sum_p1 += resp.answers.p1;
    summary[cid].sum_p2 += resp.answers.p2;
    if (resp.answers.comment && resp.answers.comment.trim() !== "") {
      summary[cid].comments.push(resp.answers.comment.trim());
    }
  });
  // Calcular promedios por curso y preparar la respuesta de reporte
  const reportData = Object.keys(summary).map(cid => {
    const agg = summary[cid];
    const avg_p1 = agg.sum_p1 / agg.count;
    const avg_p2 = agg.sum_p2 / agg.count;
    return {
      courseId: cid,
      courseName: courseInfo[cid] ? courseInfo[cid].name : cid,
      teacher: courseInfo[cid] ? courseInfo[cid].teacher : "",
      count: agg.count,
      avg_p1: parseFloat(avg_p1.toFixed(2)),
      avg_p2: parseFloat(avg_p2.toFixed(2)),
      comments: agg.comments
    };
  });
  res.json(reportData);
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
