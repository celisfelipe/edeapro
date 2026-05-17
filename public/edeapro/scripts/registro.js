/**
 * registro.js — Página de Registro Independiente (registro.html)
 * ===============================================================
 * NOTA: Este archivo pertenece a registro.html que es una página legacy.
 * El registro activo del sistema está integrado en login.html (login.js).
 *
 * registro.html y este JS se conservan pero ya no reciben tráfico activo.
 * Los botones "Agendar Cita" de las páginas de servicios apuntan a login.html.
 *
 * Conecta con: POST http://localhost/edeapro/api/registro.php (PHP original)
 */

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('registroForm');
    const btnAgregarMascota = document.getElementById('btn-agregar-mascota');
    const contenedorMascotas = document.getElementById('mascotas-container');
    let contadorMascotas = 1;

    btnAgregarMascota.addEventListener('click', (e) => {
        e.preventDefault();
        contadorMascotas++;
        const nuevaMascota = document.createElement('div');
        nuevaMascota.className = 'mascota-form';
        nuevaMascota.setAttribute('data-mascota', contadorMascotas);
        nuevaMascota.innerHTML = `
            <h3>Mascota #${contadorMascotas}</h3>
            <button type="button" class="btn-remove">✕</button>
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre de la Mascota *</label>
                    <input type="text" id="nombre-mascota-${contadorMascotas}" placeholder="Ej: Max, Luna" required>
                </div>
                <div class="form-group">
                    <label>Edad *</label>
                    <input type="number" id="edad-mascota-${contadorMascotas}" placeholder="Años" min="0" max="50" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Género *</label>
                    <select id="genero-mascota-${contadorMascotas}" required>
                        <option value="">-- Selecciona --</option>
                        <option value="macho">Macho</option>
                        <option value="hembra">Hembra</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo de Mascota *</label>
                    <select id="tipo-mascota-${contadorMascotas}" required>
                        <option value="">-- Selecciona --</option>
                        <option value="perro">Perro</option>
                        <option value="gato">Gato</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
            </div>
        `;
        contenedorMascotas.appendChild(nuevaMascota);
        nuevaMascota.querySelector('.btn-remove').addEventListener('click', () => {
            nuevaMascota.remove();
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            e.target.closest('.mascota-form').remove();
        }
    });

    formulario.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre    = document.getElementById('nombre-cliente').value;
        const apellido  = document.getElementById('apellido-cliente').value;
        const email     = document.getElementById('email').value;
        const telefono  = document.getElementById('telefono').value;
        const contrasena = document.getElementById('contrasena').value;
        const confirmar  = document.getElementById('confirmar-contrasena').value;
        const divMensaje = document.getElementById('message');

        const regexNombre   = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        const regexEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const regexTelefono = /^\+?\d{7,15}$/;
        const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

        if (!regexNombre.test(nombre)) return mostrarMensaje('El nombre solo debe contener letras', 'error', divMensaje);
        if (!regexNombre.test(apellido)) return mostrarMensaje('El apellido solo debe contener letras', 'error', divMensaje);
        if (!regexEmail.test(email)) return mostrarMensaje('Correo electrónico inválido', 'error', divMensaje);
        if (!regexTelefono.test(telefono.replace(/\s/g, ""))) return mostrarMensaje('Teléfono inválido', 'error', divMensaje);
        if (!regexPassword.test(contrasena)) return mostrarMensaje('La contraseña debe tener mayúscula, minúscula, número y símbolo', 'error', divMensaje);
        if (contrasena !== confirmar) return mostrarMensaje('Las contraseñas no coinciden', 'error', divMensaje);
        if (document.querySelectorAll('.mascota-form').length === 0) return mostrarMensaje('Debes registrar al menos una mascota', 'error', divMensaje);

        const mascotas = Array.from(document.querySelectorAll('.mascota-form')).map(m => {
            const num = m.getAttribute('data-mascota');
            return {
                nombre: document.getElementById('nombre-mascota-' + num).value,
                edad:   document.getElementById('edad-mascota-' + num).value,
                genero: document.getElementById('genero-mascota-' + num).value,
                tipo:   document.getElementById('tipo-mascota-' + num).value
            };
        });

        fetch('http://localhost/edeapro/api/registro.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                nombre:     nombre,
                apellido:   apellido,
                telefono:   telefono,
                correo:     email,
                direccion:  '',
                contrasena: contrasena,
                mascotas:   JSON.stringify(mascotas)
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                mostrarMensaje('¡Bienvenido ' + nombre + '! Registro exitoso 🚀', 'success', divMensaje);
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);
            } else {
                mostrarMensaje('Error: ' + data.error, 'error', divMensaje);
            }
        })
        .catch(() => {
            mostrarMensaje('Error conectando con el servidor', 'error', divMensaje);
        });
    });

    function mostrarMensaje(texto, tipo, div) {
        div.textContent = texto;
        div.className = 'message ' + tipo;
        div.style.display = 'block';
    }
});