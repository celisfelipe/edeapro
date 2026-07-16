/**
 * nueva-contrasena.js
 * ====================
 * Maneja el formulario de restablecimiento de contraseña.
 * Lee el token y correo de la URL y los envía al backend.
 */

const params = new URLSearchParams(window.location.search);
const token  = params.get('token');
const correo = params.get('correo');

// Si no hay token o correo en la URL redirigir al login
if (!token || !correo) {
    window.location.href = 'login.html';
}

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('name', 'show');
    } else {
        input.type = 'password';
        icon.setAttribute('name', 'hide');
    }
}

async function restablecerContrasena() {
    const contrasena = document.getElementById('nueva-password').value;
    const confirmar  = document.getElementById('nueva-confirmar').value;
    const msg        = document.getElementById('nueva-msg');

    if (!contrasena || !confirmar) {
        msg.textContent = 'Completa todos los campos.';
        msg.className   = 'mensaje error';
        return;
    }
    if (contrasena !== confirmar) {
        msg.textContent = 'Las contraseñas no coinciden.';
        msg.className   = 'mensaje error';
        return;
    }
    if (contrasena.length < 8) {
        msg.textContent = 'La contraseña debe tener mínimo 8 caracteres.';
        msg.className   = 'mensaje error';
        return;
    }

    try {
        const res  = await fetch('http://127.0.0.1:8000/api/restablecer-contrasena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ correo, token, contrasena })
        });
        const data = await res.json();

        if (data.ok) {
            msg.textContent = 'Contraseña actualizada. Redirigiendo al login...';
            msg.className   = 'mensaje success';
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            msg.textContent = data.error || 'Error al restablecer.';
            msg.className   = 'mensaje error';
        }
    } catch {
        msg.textContent = 'Error conectando con el servidor.';
        msg.className   = 'mensaje error';
    }
}