// MENSAJE DE BIENVENIDA

document.addEventListener("DOMContentLoaded", function () {

    console.log("Panel administrativo cargado correctamente");

});


// CONFIRMAR ELIMINACION

function eliminarElemento(nombre) {

    let confirmacion = confirm("¿Deseas eliminar " + nombre + "?");

    if (confirmacion) {

        alert(nombre + " eliminado correctamente");

    }

}


// BOTONES DE ELIMINAR

document.querySelectorAll(".btn-red").forEach(function (boton) {

    boton.addEventListener("click", function () {

        let fila = this.parentElement.parentElement;

        let nombre = fila.children[0].innerText;

        let confirmar = confirm("¿Eliminar este registro?");

        if (confirmar) {

            fila.remove();

        }

    });

});


// BUSCADOR DE CLIENTES

function buscarCliente() {

    let input = document.getElementById("buscar");

    let filtro = input.value.toLowerCase();

    let filas = document.querySelectorAll("table tr");

    filas.forEach(function (fila, index) {

        if (index === 0) return;

        let texto = fila.innerText.toLowerCase();

        if (texto.includes(filtro)) {

            fila.style.display = "";

        } else {

            fila.style.display = "none";

        }

    });

}


// ALERTA PARA BOTONES VER

document.querySelectorAll(".btn-blue").forEach(function (boton) {

    boton.addEventListener("click", function () {

        alert("Mostrando información...");

    });

});