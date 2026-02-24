/**
 * =====================================================
 * JAVASCRIPT - Control de Asistencia
 * =====================================================
 *  JavaScript controla el COMPORTAMIENTO de la página:
 * - Responder a clics del usuario
 * - Guardar y recuperar datos
 * - Modificar el HTML dinámicamente
 * CONCEPTOS BÁSICOS:
 * - Variables: Almacenan datos (let, const)
 * - Funciones: Bloques de código reutilizables
 * - Arrays: Listas de elementos []
 * - Objetos: Colecciones de propiedades {}
 */

// =====================================================
// CONFIGURACIÓN: Lista de departamentos
// =====================================================
// const = constante (valor que no cambia)
// Array = lista de elementos entre corchetes []
const DEPARTAMENTOS = [
    "Dirección de Talento Humano",
    "Dirección de Administración",
    "Dirección de Casa de abrigo",
    "Dirección de Igualdad de Género",
    "Dirección de Personas Adultas Mayores",
    "Dirección de Personas con Discapacidad",
    "Dirección de Protección de la Mujer",
    "Dirección de Consultoria Jurídica",
    "Dirección de Psicología y Psiquiatría",
    "Auditoria Interna",
    "Gerencia General",
    "Oficina de Atención Ciudadana",
    "Dirección de Planificación y Presupuesto",
    "Visitante"
];

// Clave para guardar datos en el navegador
const CLAVE_STORAGE = "registros-asistencia";
let idSalidaPendiente = null;

//Menu Hamburguesa

function toggleMenu() { document.getElementById('menu-enlaces').classList.toggle('mostrar'); }

// =====================================================
// INICIALIZACIÓN: Se ejecuta cuando la página carga
// =====================================================
// window.onload = función que se ejecuta al cargar la página
window.onload = function() {
    cargarDepartamentos();  // Llena el selector de departamentos
    cargarRegistros();      // Muestra los registros guardados
};

/**
 * FUNCIÓN: Cargar departamentos en el selector
 *  Recorre la lista de departamentos y crea una opción
 * para cada uno en el elemento <select>
 */
function cargarDepartamentos() {
    // document.getElementById: Busca un elemento por su id
    const selector = document.getElementById("departamento");

    if (!selector) return;
    
    // forEach: Ejecuta una función por cada elemento del array
    DEPARTAMENTOS.forEach(function(departamento) {
        // Crea un nuevo elemento <option>
        const opcion = document.createElement("option");
        opcion.value = departamento;      // Valor interno
        opcion.textContent = departamento; // Texto visible
        selector.appendChild(opcion);      // Lo agrega al selector
    });
}

/**
 * FUNCIÓN: Obtener registros guardados
 *  localStorage: Almacenamiento del navegador que persiste
 * aunque se cierre la página
 *  JSON.parse: Convierte texto a datos de JavaScript
 */
function obtenerRegistros() {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    
    // Si hay datos guardados, los convierte; si no, devuelve array vacío
    if (datos) {
        return JSON.parse(datos);
    } else {
        return [];
    }
}

/**
 * FUNCIÓN: Guardar registros en localStorage
 * JSON.stringify: Convierte datos de JavaScript a texto
 * (necesario porque localStorage solo guarda texto)
 */
function guardarRegistros(registros) {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(registros));
}

/**
 * FUNCIÓN: Obtener solo los registros de HOY
 *  Filtra la lista para mostrar únicamente los del día actual
 */
function obtenerRegistrosDeHoy() {
    const registros = obtenerRegistros();
    
    // Obtiene la fecha de hoy en formato "YYYY-MM-DD"
    const hoy = new Date().toISOString().split("T")[0];
    
    // filter: Devuelve solo los elementos que cumplen la condición
    return registros.filter(function(registro) {
        // startsWith: Verifica si el texto empieza con cierto valor
        return registro.fecha.startsWith(hoy);
    });
}

/**
 * =========================================================
 * NUEVA FUNCIÓN: Filtro de Búsqueda en Tiempo Real
 * =========================================================
 */

function filtrarTabla() {

    //1. Obtenemos lo que el usuario escribió y lo pasamos a minúsculas
    const input = document.getElementById("buscador");
    const filtro = input.value.toLowerCase();

    //2. Obtenemos la tabla y sus filas
    const tabla = document.getElementById("tabla-registros");
    const filas = tabla.getElementsByTagName("tr");

    //3. Recorremos fila por fila

    for (let i = 0; i < filas.length; i++){
        //obtenemos las celdas de Nombre(indice 0) y Cédula (indice 1)

        const celdaNombre = filas[i].getElementsByTagName("td")[0];
        const celdaCedula = filas[i].getElementsByTagName("td")[1];
        const celdaDepto = filas[i].getElementsByTagName("td")[2];

            if (celdaNombre || celdaCedula || celdaDepto ) {

                const textoNombre = celdaNombre.textContent || celdaNombre.innerText;

                const textoCedula = celdaCedula.textContent || celdaCedula.innerText;

                const textoDepto = celdaDepto.textContent || celdaDepto.innerText;
                

                //Si el texto escrito está enel nombre o en la cedula, se muestra
                if(textoNombre.toLowerCase().indexOf(filtro) > -1 || textoCedula.toLowerCase().indexOf(filtro) > -1 ||
                textoDepto.toLowerCase().indexOf(filtro) > -1){
                    filas[i].style.display = ""
                }else{
                    filas[i].style.display = "none" // Se oculta
                }
            }
    }
}

 
/**
 * FUNCIÓN: Registrar entrada en PostgreSQL*  Esta función se ejecuta cuando el usuario hace clic
 * en el botón "Registrar Entrada"
 */

async function registrarEntrada() {
    const inputNombre = document.getElementById("nombre");
    const inputCedula = document.getElementById("cedula");
    const selectDepartamento = document.getElementById("departamento");
    
    const nombre = inputNombre.value.trim();
    const cedula = inputCedula.value.trim();
    const departamento = selectDepartamento.value;
    
    if (!nombre || !cedula || !departamento) {
        mostrarNotificacion("⚠️ Por favor completa todos los campos");
        return; 
    }

    try {
        // Le enviamos la cédula al backend para que la guarde
        const respuesta = await fetch('/asistencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                cedula: cedula,
                nombre: nombre, 
                departamento: departamento
             })
        });

        if (respuesta.ok) {
            // Limpia los campos del formulario
            inputNombre.value = "";
            inputCedula.value = "";
            selectDepartamento.value = "";
            
            // Actualiza la tabla trayendo los datos frescos de la BD
            cargarRegistros();
            
            mostrarNotificacion("✓ Entrada registrada: " + nombre);
        } else {
            mostrarNotificacion("❌ Error: Verifica si la cédula ya registró entrada hoy");
        }
    } catch (error) {
        console.error("Error al registrar:", error);
        mostrarNotificacion("❌ Error de conexión con el servidor");
    }
}

//Evitar que la misma cédula se registre dos veces


/**
 * FUNCIÓN: Cargar y mostrar registros en la tabla
 *  Obtiene los registros del día y crea una fila HTML
 * por cada uno
 */
/**
 * FUNCIÓN: Cargar registros desde PostgreSQL para la tabla
 */
async function cargarRegistros() {
    const tbody = document.getElementById("tabla-registros");
    const mensajeVacio = document.getElementById("mensaje-vacio");
    const contador = document.getElementById("contador");
   
    
    if (!tbody) return;

    try {
        // Le pedimos al servidor los registros del día
        const respuesta = await fetch('/registros-hoy');
        const registros = await respuesta.json();
        
        tbody.innerHTML = "";
        
        if (registros.length === 0) {
            if (mensajeVacio) mensajeVacio.style.display = "block";
            if (contador) contador.textContent = "0";
            return;
        }
        
        if (mensajeVacio) mensajeVacio.style.display = "none";
        if (contador) contador.textContent = registros.length;
        
        // Pinta cada registro que viene de la base de datos
        registros.forEach(function(registro) {
            const fila = document.createElement("tr");
            const horaSalida = registro.hora_salida ? formatearFecha(registro.hora_salida) : "-";
            const botonSalida = registro.hora_salida ? "" : 
            `<button class="btn-icono-salida" title="Marcar Salida de ${registro.nombre}" onclick="abrirModalSalida(${registro.id}, '${registro.nombre}')">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>`;

            fila.innerHTML = `
                <td>${registro.nombre}</td>
                <td>V- ${registro.cedula}</td>
                <td><span class="badge">${registro.departamento}</span></td>
                <td>${formatearFecha(registro.hora_entrada)}</td>
                <td class="celda-salida">${horaSalida}</td>
                <td>${botonSalida}</td>
        `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error("Error cargando la tabla:", error);
    }
}
/**
 * FUNCIÓN: Formatear fecha para mostrar
 * Convierte "2024-01-15T09:30:00.000Z" a "15/01/2024 09:30:00"
 */
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    
    // padStart: Agrega ceros a la izquierda si es necesario
    const dia = fecha.getDate().toString().padStart(2, "0");
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0"); // Meses empiezan en 0
    const anio = fecha.getFullYear();
    const hora = fecha.getHours().toString().padStart(2, "0");
    const minutos = fecha.getMinutes().toString().padStart(2, "0");
    const segundos = fecha.getSeconds().toString().padStart(2, "0");
    
    return `${dia}/${mes}/${anio} ${hora}:${minutos}:${segundos}`;
}



/**
 * FUNCIÓN: Mostrar modal de confirmación (Conectada a la BD)
 */
async function confirmarExportacion() {
    try {
        const respuesta = await fetch('/registros-hoy');
        const registros = await respuesta.json();
        
        if (registros.length === 0) {
            mostrarNotificacion("⚠️ No hay registros para exportar");
            return;
        }
        
        const modal = document.getElementById("modal-confirmacion");
        if (modal) modal.classList.add("activo");
    } catch (error) {
        mostrarNotificacion("❌ Error al verificar registros");
    }
}

/**
 * FUNCIÓN: Cerrar el modal
 */
function cerrarModal() {
    const modal = document.getElementById("modal-confirmacion");
    modal.classList.remove("activo");
}

/**
 * =========================================================
 * FUNCIONES DEL MODAL DE SALIDA
 * =========================================================
 */
function abrirModalSalida(id, nombre) {
    idSalidaPendiente = id;
    // Inyectamos el texto dinámico
    document.getElementById("texto-confirmacion-salida").innerHTML = `¿Seguro que quieres confirmar la salida de <strong>${nombre}</strong>?`;
    document.getElementById("modal-salida").classList.add("activo");
}

function cerrarModalSalida() {
    idSalidaPendiente = null;
    document.getElementById("modal-salida").classList.remove("activo");
}

async function ejecutarSalida() {
    if (!idSalidaPendiente) return;

    try {
        const respuesta = await fetch(`/salida/${idSalidaPendiente}`, { method: 'PUT' });
        
        if (respuesta.ok) {
            mostrarNotificacion("👋 Hora de salida registrada exitosamente");
            cerrarModalSalida();
            cargarRegistros(); // Refresca la tabla instantáneamente
        } else {
            mostrarNotificacion("❌ Error al registrar salida");
        }
    } catch (error) {
        mostrarNotificacion("❌ Error conectando con la Base de Datos");
    }
}

/* ==========================================================================
   NUEVAS FUNCIONES DE EXPORTACIÓN
   ========================================================================== */

/**
 * 1. Función para el botón "SOLO EXPORTAR"
 */
function exportarSolo() {
    // Llamamos a la función maestra con false (NO vaciar)
    generarDocumentoPDF(false);
}

/**
 * 2. Función para el botón "EXPORTAR Y VACIAR"
 */
function exportarYVaciar() {
    // Llamamos a la función maestra con true (SÍ vaciar)
    generarDocumentoPDF(true);
}

/**
 *Generar el PDF (Conectada a la BD)
 */
async function generarDocumentoPDF(debeVaciar) {
    cerrarModal();
    
    try {
        // Obtenemos los datos frescos de la base de datos
        const respuesta = await fetch('/registros-hoy');
        const registros = await respuesta.json();
        
        if (registros.length === 0) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const hoy = new Date();
        const fechaFormateada = hoy.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        
        doc.setFontSize(18);
        doc.setTextColor(30, 58, 95);
        doc.text("Registro de Asistencia", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(fechaFormateada, 105, 30, { align: "center" });
        
        doc.setFontSize(10);
        doc.text(`Total de registros: ${registros.length}`, 14, 45);
        doc.text(`Generado: ${formatearFecha(new Date().toISOString())}`, 14, 52);
        
        // Mapeamos los datos para la tabla del PDF
        const datosTabla = registros.map(function(registro) {
            return [
                registro.nombre,
                "V- " + registro.cedula,
                registro.departamento,
                formatearFecha(registro.hora_entrada), // Usamos hora_entrada de la BD
                registro.hora_salida ? formatearFecha(registro.hora_salida) : "Sin marcar"
            ];
        });
        
        doc.autoTable({
            startY: 60,
            head: [["Nombre", "Cédula", "Departamento", "Entrada", "Salida"]],
            body: datosTabla,
            headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [240, 249, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        });
        
        const nombreArchivo = `asistencia_${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, "0")}-${hoy.getDate().toString().padStart(2, "0")}.pdf`;
        doc.save(nombreArchivo);
        
        // Lógica para VACIAR la base de datos si el usuario lo eligió
        if (debeVaciar === true) {
            await fetch('/vaciar-hoy', { method: 'DELETE' });
            mostrarNotificacion(`✓ Exportados y vaciados ${registros.length} registros`);
            cargarRegistros(); // Recarga la tabla en blanco
        } else {
            mostrarNotificacion(`✓ Archivo descargado (Registros conservados)`);
        }
    } catch (error) {
        console.error("Error al exportar:", error);
        mostrarNotificacion("❌ Error al generar el PDF");
    }
}

/**
 * FUNCIÓN: Limpiar los registros del día
 * * Mantiene los registros de días anteriores y elimina
 * solo los de hoy
 */
function limpiarRegistrosDeHoy() {
    const registros = obtenerRegistros();
    const hoy = new Date().toISOString().split("T")[0];
    
    // Filtra y mantiene solo los que NO son de hoy
    const registrosRestantes = registros.filter(function(registro) {
        return !registro.fecha.startsWith(hoy);
    });
    
    guardarRegistros(registrosRestantes);
}

/**
 * FUNCIÓN: Mostrar notificación temporal
 * * Muestra un mensaje en la esquina inferior derecha
 * que desaparece después de 3 segundos
 */
function mostrarNotificacion(mensaje) {
    const notificacion = document.getElementById("notificacion");
    const texto = document.getElementById("notificacion-texto");
    
    texto.textContent = mensaje;
    notificacion.classList.add("visible");
    
    // setTimeout: Ejecuta código después de X milisegundos
    setTimeout(function() {
        notificacion.classList.remove("visible");
    }, 3000);  // 3000ms = 3 segundos
}

/**
 * =========================================================
 * NUEVA FUNCIÓN: Buscar empleado en la Base de Datos
 * =========================================================
 */
async function buscarEmpleadoPorCedula() {
    const inputCedula = document.getElementById("cedula");
    const inputNombre = document.getElementById("nombre");
    const selectDepartamento = document.getElementById("departamento");
    
    const cedulaBuscada = inputCedula.value.trim();

    // Solo busca si la cédula tiene al menos 6 números
    if (cedulaBuscada.length < 6) return;

    try {
        // Hacemos la petición a tu servidor Node.js
        const respuesta = await fetch(`/empleado/${cedulaBuscada}`);
        
        if (respuesta.ok) {
            const empleado = await respuesta.json();
            
            // ¡AUTO-RELLENO!
            inputNombre.value = empleado.nombre;
            selectDepartamento.value = empleado.departamento;
            
            mostrarNotificacion("✅ Empleado encontrado: " + empleado.cargo);
            
            // Opcional: Aquí podríamos hacer que se registre la entrada automáticamente
            // registrarEntrada(); 
            
        } else {
            // Si no existe en la base de datos
            mostrarNotificacion("⚠️ Empleado no registrado en el sistema");
        }
    } catch (error) {
        console.error("Error conectando con el servidor:", error);
        mostrarNotificacion("❌ Error de conexión con la Base de Datos");
    }
}

/**
 * =========================================================
 * FUNCIONES PARA GESTIÓN DE PERSONAL (CRUD)
 * =========================================================
 */

// Lógica específica para cargar empleados al abrir la página
        window.addEventListener('load', () => {
            cargarDepartamentosEdicion();
            cargarBaseDatosEmpleados();
        });

  let cedulaEnEdicion = null;

async function cargarBaseDatosEmpleados() {
    const tbody = document.getElementById("tabla-empleados");
    if (!tbody) return;

    try {
        const respuesta = await fetch('/empleados');
        const empleados = await respuesta.json();
        
        tbody.innerHTML = "";
        empleados.forEach(emp => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${emp.nombre}</td>
                <td>V- ${emp.cedula}</td>
                <td><span class="badge">${emp.departamento}</span></td>
                <td>${emp.cargo || 'Sin cargo'}</td>
                <td>
                    <button class="btn-icono-editar" title="Editar a ${emp.nombre}" onclick="abrirModalEditar('${emp.cedula}', '${emp.nombre}', '${emp.departamento}', '${emp.cargo}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) { console.error(error); }
}

function abrirModalEditar(cedula, nombre, depto, cargo) {
    cedulaEnEdicion = cedula;
    document.getElementById("edit-nombre").value = nombre;
    document.getElementById("edit-cedula").value = cedula;
    document.getElementById("edit-departamento").value = depto;
    document.getElementById("edit-cargo").value = cargo === 'null' ? '' : cargo;
    document.getElementById("modal-editar").classList.add("activo");
}

function cerrarModalEditar() {
    document.getElementById("modal-editar").classList.remove("activo");
}

async function guardarCambiosEmpleado() {
    const datos = {
        nombre: document.getElementById("edit-nombre").value,
        departamento: document.getElementById("edit-departamento").value,
        cargo: document.getElementById("edit-cargo").value
    };

    const res = await fetch(`/empleado/${cedulaEnEdicion}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(datos)
    });

    if (res.ok) {
        mostrarNotificacion("✅ Datos del empleado actualizados");
        cerrarModalEditar();
        cargarBaseDatosEmpleados();
    }
}

// === LÓGICA DE BORRADO SEGURO ===
function confirmarBorrado() {
    const nombre = document.getElementById("edit-nombre").value;
    
    // Cerramos el modal de editar y abrimos el de peligro
    cerrarModalEditar();
    document.getElementById("texto-borrar").innerHTML = `¿Estás completamente seguro de que deseas eliminar a <strong>${nombre}</strong> del sistema? Esta acción no se puede deshacer.`;
    document.getElementById("modal-borrar").classList.add("activo");
}

function cerrarModalBorrar() {
    document.getElementById("modal-borrar").classList.remove("activo");
}

async function ejecutarBorrado() {
    if (!cedulaEnEdicion) return;

    try {
        const res = await fetch(`/empleado/${cedulaEnEdicion}`, { method: 'DELETE' });
        
        if (res.ok) {
            mostrarNotificacion("🗑️ Empleado eliminado correctamente");
            cerrarModalBorrar();
            cargarBaseDatosEmpleados();
        } else {
            // El backend nos manda un error si tiene asistencias por integridad de la DB
            mostrarNotificacion("❌ No se puede eliminar: Tiene asistencias registradas");
            cerrarModalBorrar();
        }
    } catch (error) {
        mostrarNotificacion("❌ Error de conexión al eliminar");
    }
}

function cargarDepartamentosEdicion() {
    const selector = document.getElementById("edit-departamento");
    if (!selector) return;
    DEPARTAMENTOS.forEach(d => {
        const op = document.createElement("option");
        op.value = d; op.textContent = d;
        selector.appendChild(op);
    });
}

// Filtro buscador específico para la tabla del CRUD
function filtrarTablaEmpleados() {
    const input = document.getElementById("buscador-empleados");
    const filtro = input.value.toLowerCase();
    const filas = document.getElementById("tabla-empleados").getElementsByTagName("tr");

    for (let i = 0; i < filas.length; i++) {
        let textoFila = filas[i].textContent || filas[i].innerText;
        filas[i].style.display = textoFila.toLowerCase().indexOf(filtro) > -1 ? "" : "none";
    }
} 

/**
 * =========================================================
 * FUNCIONES PARA AÑADIR NUEVO EMPLEADO MANUALMENTE
 * =========================================================
 */
function abrirModalAgregar() {
    // Limpiamos los campos primero
    document.getElementById("add-nombre").value = "";
    document.getElementById("add-cedula").value = "";
    document.getElementById("add-cargo").value = "";
    
    // Llenamos el select si está vacío
    const selectAdd = document.getElementById("add-departamento");
    if (selectAdd && selectAdd.options.length <= 1) {
        DEPARTAMENTOS.forEach(d => {
            const op = document.createElement("option");
            op.value = d; op.textContent = d;
            selectAdd.appendChild(op);
        });
    }
    
    document.getElementById("modal-agregar").classList.add("activo");
}

function cerrarModalAgregar() {
    document.getElementById("modal-agregar").classList.remove("activo");
}

async function guardarNuevoEmpleado() {
    const datos = {
        nombre: document.getElementById("add-nombre").value.trim(),
        cedula: document.getElementById("add-cedula").value.trim(),
        departamento: document.getElementById("add-departamento").value,
        cargo: document.getElementById("add-cargo").value.trim()
    };

    if (!datos.nombre || !datos.cedula || !datos.departamento) {
        mostrarNotificacion("⚠️ Nombre, cédula y departamento son obligatorios");
        return;
    }

    try {
        const res = await fetch(`/empleado`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            mostrarNotificacion("✅ Empleado añadido con éxito");
            cerrarModalAgregar();
            cargarBaseDatosEmpleados(); // Recargamos la tabla
        } else {
            mostrarNotificacion("❌ La cédula ya está registrada en el sistema");
        }
    } catch (error) {
        mostrarNotificacion("❌ Error de conexión con la base de datos");
    }
}

/**
 * =========================================================
 * FUNCIONES DE LOGIN Y CARRUSEL
 * =========================================================
 */
// 1. Motor del Carrusel de imágenes
function iniciarCarrusel() {
    const imagenes = document.querySelectorAll('.carousel-img');
    // Si no hay imágenes (porque no estamos en la página de login), no hace nada
    if (imagenes.length === 0) return; 

    let indexActual = 0;
    // Cambia de imagen cada 4000 milisegundos (4 segundos)
    setInterval(() => {
        imagenes[indexActual].classList.remove('activa');
        indexActual = (indexActual + 1) % imagenes.length;
        imagenes[indexActual].classList.add('activa');
    }, 4000); 
}

// 2. Simulación de Validación de Acceso
function iniciarSesion(event) {
    event.preventDefault(); // Evita que la página se recargue al enviar el formulario
    
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();

    // Credenciales maestras para tu defensa del proyecto
    if (user === "admin" && pass === "123456") {

        sessionStorage.setItem("autenticado", "true");
        // Redirige al menú principal si los datos son correctos
        window.location.href = "dashboard.html";
    } else {
        mostrarNotificacion("❌ Usuario o contraseña incorrectos");
    }
}

// 3. Función global para cerrar sesión (Úsala en tu Navbar)
function cerrarSesion() {

    // 👇 Destruimos el "Pase VIP" al salir
    sessionStorage.removeItem("autenticado");
    window.location.href = "login.html";
}

// 4. GUARDIA DE SEGURIDAD (Protección de Rutas)
function verificarSeguridad() {
    // Vemos en qué página está intentando entrar el usuario
    const paginaActual = window.location.pathname;
    
    // Verificamos si tiene el pase en el bolsillo
    const tieneAcceso = sessionStorage.getItem("autenticado") === "true";

    // Si NO tiene acceso y NO está en la página de login... ¡Lo echamos al login!
    if (!tieneAcceso && !paginaActual.includes("login.html")) {
        window.location.href = "login.html";
    }
    
    // Si SÍ tiene acceso (ya inició sesión) y trata de ir al login, lo mandamos al dashboard
    if (tieneAcceso && paginaActual.includes("login.html")) {
        window.location.href = "dashboard.html";
    }
}

// Ejecutamos al guardia inmediatamente carga el script
verificarSeguridad();

// Iniciamos el carrusel cuando la ventana cargue
window.addEventListener('load', () => {
    iniciarCarrusel();
});