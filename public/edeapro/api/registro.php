<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

$nombre     = $_POST['nombre'];
$apellido   = $_POST['apellido'];
$telefono   = $_POST['telefono'];
$correo     = $_POST['correo'];
$direccion  = $_POST['direccion'];
$contrasena = $_POST['contrasena'];

// Verificar si el correo ya existe
$check = mysqli_query($conn, "SELECT id_cliente FROM cliente WHERE correo = '$correo'");
if (mysqli_num_rows($check) > 0) {
    echo json_encode(["ok" => false, "error" => "El correo ya está registrado"]);
    exit;
}

// Obtener el siguiente id cliente
$res = mysqli_query($conn, "SELECT IFNULL(MAX(id_cliente), 0) + 1 AS nuevo_id FROM cliente");
$row = mysqli_fetch_assoc($res);
$nuevo_id = $row['nuevo_id'];

// Insertar cliente
$sql = "INSERT INTO cliente (id_cliente, nombre, apellido, telefono, correo, direccion, contrasena)
        VALUES ($nuevo_id, '$nombre', '$apellido', '$telefono', '$correo', '$direccion', '$contrasena')";

if (!mysqli_query($conn, $sql)) {
    echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    exit;
}

// Insertar mascotas
$mascotas = json_decode($_POST['mascotas'], true);

$id_mascota_res = mysqli_query($conn, "SELECT IFNULL(MAX(id_mascota), 0) + 1 AS nuevo_id FROM mascota");
$id_mascota_row = mysqli_fetch_assoc($id_mascota_res);
$id_mascota = $id_mascota_row['nuevo_id'];

foreach ($mascotas as $mascota) {
    $nombre_m = $mascota['nombre'];
    $especie  = $mascota['tipo'] === 'gato' ? 'Felino' : 'Canino';
    $edad     = intval($mascota['edad']);
    $genero   = ucfirst($mascota['genero']);

    $sql_m = "INSERT INTO mascota (id_mascota, id_cliente, nombre, especie, edad, genero)
              VALUES ($id_mascota, $nuevo_id, '$nombre_m', '$especie', $edad, '$genero')";

    mysqli_query($conn, $sql_m);
    $id_mascota++;
}

echo json_encode(["ok" => true]);

mysqli_close($conn);
?>