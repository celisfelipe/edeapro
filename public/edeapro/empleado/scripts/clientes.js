/**
 * clientes.js — Panel Empleado / Clientes
 * =========================================
 * Muestra la lista de clientes registrados en el sistema (solo lectura).
 * El empleado puede ver pero no editar ni eliminar clientes.
 * La sesión (rol "peluquero") la verifica sesion.js.
 *
 * Conecta con la API de Laravel:
 *   GET /api/admin/clientes → todos los clientes (ruta compartida con el admin)
 */

// Guarda todos los clientes para filtrar sin ir al servidor cada vez
let todosLosClientes = [];

document.addEventListener('DOMContentLoaded', function () {

    if (!verificarSesionEmpleado()) return;

    // Cargar todos los clientes del sistema
    fetchAuth('http://127.0.0.1:8000/api/admin/clientes-empleado')
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            todosLosClientes = data.clientes;
            mostrarClientes(todosLosClientes);
        }
    })
    .catch(() => {
        document.getElementById('tabla-clientes').innerHTML = '<tr><td colspan="3">Error cargando clientes</td></tr>';
    });

    // Buscador en tiempo real — filtra el array local sin ir al servidor
    document.getElementById('buscador').addEventListener('input', function () {
        const texto = this.value.toLowerCase();
        const filtrados = todosLosClientes.filter(c =>
            c.nombre.toLowerCase().includes(texto)   ||
            c.apellido.toLowerCase().includes(texto) ||
            c.telefono.includes(texto)               ||
            c.correo.toLowerCase().includes(texto)
        );
        mostrarClientes(filtrados);
    });
});

/** Renderiza el array de clientes en la tabla — sin botones de acción */
function mostrarClientes(clientes) {
    const tbody = document.getElementById('tabla-clientes');
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No se encontraron clientes</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    clientes.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td>${c.nombre} ${c.apellido}</td>
                <td>${c.telefono}</td>
                <td>${c.correo}</td>
            </tr>`;
    });
}
