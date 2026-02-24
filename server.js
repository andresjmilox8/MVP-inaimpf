const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path'); // NUEVO: Para manejar rutas de carpetas

const app = express();
app.use(cors());
app.use(express.json());

// NUEVO: Le decimos a Express que muestre los archivos de la carpeta "public"
app.use(express.static(path.join(__dirname, 'public'))); 

// CONEXIÓN A BASE DE DATOS EN LA NUBE (Preparada para Render/Neon)
const pool = new Pool({
    // Usará la URL de la nube si existe, o tu base de datos local si estás en tu PC
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:040506@localhost:5432/inaimpf_asistencia',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // Requisito obligatorio para bases de datos en la nube
});

// 1. Ruta para buscar empleado por cédula (Auto-relleno)
app.get('/empleado/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        const result = await pool.query('SELECT * FROM empleados WHERE cedula = $1', [cedula]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: "No encontrado" });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 2. REGISTRAR ENTRADA (CON VALIDACIÓN DE DUPLICADOS INTELIGENTE: CREA AL EMPLEADO SI NO EXISTE)

app.post('/asistencia', async (req, res) => {
    try {
        // Ahora recibimos los 3 datos
        const { cedula, nombre, departamento } = req.body;
        
        // A. Verificamos si la persona ya existe en la tabla "empleados"
        const empCheck = await pool.query('SELECT * FROM empleados WHERE cedula = $1', [cedula]);
        
        // Si no existe, lo insertamos automáticamente como nuevo
        if (empCheck.rows.length === 0) {
            await pool.query(
                'INSERT INTO empleados (cedula, nombre, departamento, cargo) VALUES ($1, $2, $3, $4)',
                [cedula, nombre, departamento, 'Visitante / Nuevo']
            );
        }

        // B. Verificamos si ya registró entrada hoy para no duplicar
        const chequeo = await pool.query(
            'SELECT * FROM asistencias WHERE cedula_empleado = $1 AND fecha = CURRENT_DATE',
            [cedula]
        );

        if (chequeo.rows.length > 0) {
            return res.status(400).json({ error: "Ya registró entrada hoy" });
        }

        // C. Finalmente, registramos la asistencia en el historial
        const result = await pool.query(
            'INSERT INTO asistencias (cedula_empleado) VALUES ($1) RETURNING *',
            [cedula]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 3. Ruta para obtener los registros de hoy 
app.get('/registros-hoy', async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.hora_entrada, a.hora_salida, e.nombre, e.cedula, e.departamento
            FROM asistencias a 
            JOIN empleados e ON a.cedula_empleado = e.cedula 
            WHERE a.fecha = CURRENT_DATE 
            ORDER BY a.hora_entrada DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 3.2. REGISTRAR HORA DE SALIDA
app.put('/salida/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE asistencias SET hora_salida = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 4. Vaciar registros de hoy (Para el botón "Exportar y Vaciar")
app.delete('/vaciar-hoy', async (req, res) => {
    try {
        await pool.query('DELETE FROM asistencias WHERE fecha = CURRENT_DATE');
        res.json({ message: "Registros de hoy vaciados" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 5. OBTENER TODOS LOS EMPLEADOS (PARA EL CRUD)
app.get('/empleados', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM empleados ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 6. ACTUALIZAR DATOS DE UN EMPLEADO
app.put('/empleado/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        const { nombre, departamento, cargo } = req.body;
        await pool.query(
            'UPDATE empleados SET nombre = $1, departamento = $2, cargo = $3 WHERE cedula = $4',
            [nombre, departamento, cargo, cedula]
        );
        res.json({ message: "Empleado actualizado" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// 7. ELIMINAR EMPLEADO (Borrado en cascada seguro)
app.delete('/empleado/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        // Primero borramos su historial de asistencia
        await pool.query('DELETE FROM asistencias WHERE cedula_empleado = $1', [cedula]);
        // Luego borramos al empleado de la base de datos
        await pool.query('DELETE FROM empleados WHERE cedula = $1', [cedula]);
        
        res.json({ message: "Empleado eliminado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar en la Base de Datos." });
    }
});

// 8. CREAR NUEVO EMPLEADO MANUALMENTE (Para el botón +)
app.post('/empleado', async (req, res) => {
    try {
        const { cedula, nombre, departamento, cargo } = req.body;
        
        // Verificamos si la cédula ya existe
        const check = await pool.query('SELECT * FROM empleados WHERE cedula = $1', [cedula]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: "La cédula ya está registrada" });
        }

        // Lo insertamos
        await pool.query(
            'INSERT INTO empleados (cedula, nombre, departamento, cargo) VALUES ($1, $2, $3, $4)',
            [cedula, nombre, departamento, cargo || 'Empleado']
        );
        res.json({ message: "Empleado creado exitosamente" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// NUEVO: Puerto dinámico para la nube
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en el puerto ${PORT}`);
});
