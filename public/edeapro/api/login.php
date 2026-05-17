<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

$correo     = $_POST['correo'];
$contrasena = $_POST['contrasena'];

// Buscar en cliente
$sql = "SELECT id_cliente, nombre, apellido, correo FROM cliente 
        WHERE correo = '$correo' AND contrasena = '$contrasena'";
$res = mysqli_query($conn, $sql);

if (mysqli_num_rows($res) > 0) {
    $cliente = mysqli_fetch_assoc($res);
    echo json_encode(["ok" => true, "rol" => "cliente", "user" => $cliente]);
    exit;
}

// Buscar en estilista
$sql2 = "SELECT id_estilista, nombre_estilista, apellido_estilista, rol FROM estilista 
         WHERE correo = '$correo' AND contrasena = '$contrasena'";
$res2 = mysqli_query($conn, $sql2);

if (mysqli_num_rows($res2) > 0) {
    $estilista = mysqli_fetch_assoc($res2);
    echo json_encode(["ok" => true, "rol" => strtolower($estilista['rol']), "user" => $estilista]);
    exit;
}

echo json_encode(["ok" => false, "error" => "Correo o contrasena incorrectos"]);

mysqli_close($conn);
?>