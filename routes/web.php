<?php

use Illuminate\Support\Facades\Route;

// La dirección principal del sitio abre directo la página de inicio
Route::get('/', function () {
    return redirect('/edeapro/paginas/inicio.html');
});
