// La API está en el mismo servidor que sirve las páginas, así que se usa
// la misma dirección del navegador: funciona en 127.0.0.1, en localhost
// y en Railway sin tocar nada.
const API_BASE = window.location.origin;

// ID de cliente de Google para el botón "Continuar con Google".
// Es público (Google lo muestra en la página); el secreto NUNCA va aquí.
const GOOGLE_CLIENT_ID = '94369443578-qo1jqq5a557dnp6kgqot61tqcoeet1qt.apps.googleusercontent.com';