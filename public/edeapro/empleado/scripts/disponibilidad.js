/**
 * disponibilidad.js — Panel Empleado / Disponibilidad
 * =====================================================
 * Muestra la grilla de horarios del día filtrada para el estilista logueado.
 * El empleado solo ve sus propias citas — las de otros estilistas no aparecen.
 * Verifica que el usuario tenga rol "peluquero" en localStorage.
 *
 * Conecta con la API de Laravel:
 *   GET /api/admin/horarios?fecha=YYYY-MM-DD → citas de todos; se filtra en JS por id_estilista
 */

document.addEventListener('DOMContentLoaded', function () {

    const user = JSON.parse(localStorage.getItem('user'));
    const rol  = localStorage.getItem('rol');

    if (!user || rol !== 'peluquero') {
        window.location.href = '../../paginas/login.html';
        return;
    }

    document.getElementById('nombre-empleado').textContent = user.nombre_estilista + ' ' + user.apellido_estilista;

    // Poner la fecha de hoy por defecto y cargar la grilla
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fecha-selector').value = hoy;

    cargarHorarios();
});

/**
 * Trae las citas del día desde Laravel y construye la grilla de horarios.
 * Filtra las citas para mostrar solo las del estilista logueado.
 * Genera slots de 30 min entre 9:00 y 17:00.
 */
function cargarHorarios() {
    const fecha = document.getElementById('fecha-selector').value;
    const user  = JSON.parse(localStorage.getItem('user'));
    if (!fecha) return;

    fetchAuth(`http://127.0.0.1:8000/api/admin/horarios?fecha=${fecha}`)
    .then(res => res.json())
    .then(data => {
        if (!data.ok) return;

        const contenedor = document.getElementById('contenedor-horarios');

        // Filtrar solo las citas asignadas a este estilista
        const citas = data.citas.filter(c => c.id_estilista == user.id_estilista);

        // Generar slots de 30 min entre 9:00 y 17:00
        const horas = [];
        for (let h = 9; h <= 17; h++) {
            horas.push(`${String(h).padStart(2, '0')}:00`);
            if (h < 17) horas.push(`${String(h).padStart(2, '0')}:30`);
        }

        let html = `<table class="horario-table">
            <tr>
                <th>Hora</th>
                <th>Cita</th>
            </tr>`;

        horas.forEach(hora => {
            // Buscar si hay una cita en este slot
            const cita = citas.find(c => c.hora.substring(0, 5) === hora);
            if (cita) {
                const clase = cita.estado === 'Completada' ? 'completada' : '';
                html += `<tr>
                    <td class="hora-col">${formatoHora12(hora)}</td>
                    <td>
                        <div class="cita-bloque ${clase}">
                            <i class="fa-solid fa-paw"></i> ${cita.nombre_raza}<br>
                            <small>${cita.nombre_cliente} ${cita.apellido_cliente}</small>
                        </div>
                    </td>
                </tr>`;
            } else {
                html += `<tr>
                    <td class="hora-col">${formatoHora12(hora)}</td>
                    <td><span class="libre">Libre</span></td>
                </tr>`;
            }
        });

        html += '</table>';
        contenedor.innerHTML = html;
    });
}

/** Elimina la sesión del localStorage y redirige al login */
function cerrarSesion() {
    localStorage.removeItem('user');
    localStorage.removeItem('rol');
    window.location.href = '../../paginas/login.html';
}
