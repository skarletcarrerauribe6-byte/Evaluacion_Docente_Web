const bcrypt = require("bcrypt");
const fs = require("fs");

// Carga tu archivo JSON
const data = require("./data.json"); 
// Cambia "data.json" por el nombre real del archivo

// Itera sobre profesores y admins, encriptando sus contraseñas
async function encryptPasswords() {
  const saltRounds = 10;

  // Encriptar passwords de profesores
  for (const prof of data.professors) {
    const hashed = await bcrypt.hash(prof.password, saltRounds);
    prof.password = hashed;
  }

  // Encriptar passwords de administradores
  for (const admin of data.admins) {
    const hashed = await bcrypt.hash(admin.password, saltRounds);
    admin.password = hashed;
  }

  // Encriptar passwords de Alumnos
  for (const students of data.students) {
    const hashed = await bcrypt.hash(students.password, saltRounds);
    students.password = hashed;
  }

  // Guardar archivo actualizado
  fs.writeFileSync("./data_hashed.json", JSON.stringify(data, null, 2));

  console.log("Contraseñas encriptadas correctamente ✅");
}

encryptPasswords();

