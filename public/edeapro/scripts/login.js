/**
 * login.js — Página de Login y Registro
 * ========================================
 * Maneja el inicio de sesión y el registro en la misma página (login.html).
 * Los dos formularios conviven: login-box y registro-box.
 * Se alternan con mostrarRegistro() y mostrarLogin() sin recargar.
 *
 * Conecta con la API de Laravel:
 *   POST http://127.0.0.1:8000/api/login    → iniciarSesion()
 *   POST http://127.0.0.1:8000/api/registro → registrarse()
 *
 * Al iniciar sesión guarda en localStorage:
 *   'user' → objeto con los datos del usuario
 *   'rol'  → 'cliente', 'administrador' o 'peluquero'
 */

// Contador para numerar las mascotas en el formulario de registro
let contadorMascotas = 1;

/** Muestra el formulario de registro y oculta el de login */
function mostrarRegistro() {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('registro-box').classList.remove('hidden');
}

/** Muestra el formulario de login y oculta el de registro */
function mostrarLogin() {
    document.getElementById('registro-box').classList.add('hidden');
    document.getElementById('login-box').classList.remove('hidden');
}

/**
 * Alterna la visibilidad del campo de contraseña.
 * Cambia entre type="password" y type="text".
 * @param {string} inputId - id del input de contraseña
 * @param {string} iconId  - id del ícono de ojo
 */
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

/**
 * Envía las credenciales a Laravel y redirige según el rol.
 * Roles posibles: 'cliente', 'administrador', 'peluquero'.
 */
function iniciarSesion() {
    const correo     = document.getElementById('login-correo').value;
    const contrasena = document.getElementById('login-password').value;
    const msg        = document.getElementById('login-msg');

    if (!correo || !contrasena) {
        mostrarMsg(msg, 'Completa todos los campos', 'error');
        return;
    }

    fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ correo, contrasena })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            // Guardar sesión en localStorage incluyendo el token de seguridad
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('token', data.token);

            // Redirigir al panel correspondiente según el rol
            if (data.rol === 'cliente') {
                window.location.href = '../cliente/perfil.html';
            } else if (data.rol === 'administrador') {
                window.location.href = '../administrador/paginas/inicio.html';
            } else if (data.rol === 'peluquero') {
                window.location.href = '../empleado/paginas/inicio.html';
            }
        } else {
            mostrarMsg(msg, data.error, 'error');
        }
    })
    .catch(() => mostrarMsg(msg, 'Error conectando con el servidor', 'error'));
}

/**
 * Agrega un nuevo bloque de campos de mascota al formulario de registro.
 * Cada mascota tiene: nombre, edad, género y tipo.
 */
function agregarMascota() {
    contadorMascotas++;
    const num        = contadorMascotas;
    const contenedor = document.getElementById('mascotas-container');
    const div        = document.createElement('div');
    div.className    = 'mascota-item';
    div.setAttribute('data-num', num);
    div.innerHTML = `
        <p class="mascota-titulo">Mascota #${num}</p>
        <button class="btn-quitar" onclick="quitarMascota(${num})">✕</button>
        <div class="form-grid">
            <div class="input-group">
                <label>Nombre</label>
                <input type="text" id="mascota-nombre-${num}" placeholder="Ej: Max">
            </div>
            <div class="input-group">
                <label>Edad</label>
                <input type="number" id="mascota-edad-${num}" placeholder="Años" min="0" max="50">
            </div>
            <div class="input-group">
                <label>Género</label>
                <select id="mascota-genero-${num}">
                    <option value="">-- Selecciona --</option>
                    <option value="macho">Macho</option>
                    <option value="hembra">Hembra</option>
                </select>
            </div>
            <div class="input-group">
                <label>Tipo</label>
                <select id="mascota-tipo-${num}">
                    <option value="">-- Selecciona --</option>
                    <option value="perro">Perro</option>
                    <option value="gato">Gato</option>
                    <option value="otro">Otro</option>
                </select>
            </div>
        </div>`;
    contenedor.appendChild(div);
}

/** Elimina el bloque de una mascota del formulario */
function quitarMascota(num) {
    const div = document.querySelector(`[data-num="${num}"]`);
    if (div) div.remove();
}

/**
 * Valida el formulario de registro y envía los datos a Laravel.
 * Recoge los datos de todas las mascotas y los envía como JSON.
 * Si el registro es exitoso, cambia automáticamente al formulario de login.
 */
function registrarse() {
    const nombre    = document.getElementById('reg-nombre').value;
    const apellido  = document.getElementById('reg-apellido').value;
    const correo    = document.getElementById('reg-correo').value;
    const telefono  = document.getElementById('reg-telefono').value;
    const password  = document.getElementById('reg-password').value;
    const confirmar = document.getElementById('reg-confirmar').value;
    const msg       = document.getElementById('reg-msg');

    // Validaciones básicas antes de enviar al servidor
    if (!nombre || !apellido || !correo || !telefono || !password || !confirmar) {
        mostrarMsg(msg, 'Completa todos los campos', 'error');
        return;
    }
    if (password !== confirmar) {
        mostrarMsg(msg, 'Las contraseñas no coinciden', 'error');
        return;
    }
    if (password.length < 8) {
        mostrarMsg(msg, 'La contraseña debe tener mínimo 8 caracteres', 'error');
        return;
    }

    // Recopilar datos de todas las mascotas del formulario
    const mascotas = Array.from(document.querySelectorAll('.mascota-item')).map(m => {
        const num = m.getAttribute('data-num');
        return {
            nombre: document.getElementById('mascota-nombre-' + num).value,
            edad:   document.getElementById('mascota-edad-' + num).value,
            genero: document.getElementById('mascota-genero-' + num).value,
            tipo:   document.getElementById('mascota-tipo-' + num).value
        };
    });

    // Verificar que todas las mascotas tengan datos completos
    const sinDatos = mascotas.some(m => !m.nombre || !m.edad || !m.genero || !m.tipo);
    if (sinDatos) {
        mostrarMsg(msg, 'Completa los datos de todas las mascotas', 'error');
        return;
    }

    fetch('http://127.0.0.1:8000/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            nombre, apellido, correo, telefono,
            direccion:  '',
            contrasena: password,
            mascotas:   JSON.stringify(mascotas)
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            mostrarMsg(msg, '¡Cuenta creada! Inicia sesión.', 'success');
            // Cambiar al formulario de login después de 2 segundos
            setTimeout(() => mostrarLogin(), 2000);
        } else {
            mostrarMsg(msg, data.error, 'error');
        }
    })
    .catch(() => mostrarMsg(msg, 'Error conectando con el servidor', 'error'));
}

/**
 * Muestra un mensaje de error o éxito debajo del formulario.
 * @param {HTMLElement} div  - Elemento donde se muestra el mensaje
 * @param {string}      texto - Texto del mensaje
 * @param {string}      tipo  - 'error' o 'success'
 */
function mostrarMsg(div, texto, tipo) {
    div.textContent = texto;
    div.className   = 'mensaje ' + tipo;
}
