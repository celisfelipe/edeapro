<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Editar precio y duracion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'editar') {
    $id_raza   = intval($_POST['id_raza']);
    $id_servicio = intval($_POST['id_servicio']);
    $precio    = $_POST['precio'];
    $duracion  = $_POST['duracion'];

    $sql = "UPDATE raza_servicio SET precio = '$precio', duracion = '$duracion' 
            WHERE id_raza = $id_raza AND id_servicio = $id_servicio";

    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer servicios con razas
$sql = "SELECT r.id_raza, r.nombre_raza, s.id_servicio, s.nombre_servicio, rs.duracion, rs.precio
        FROM raza_servicio rs
        JOIN raza r ON rs.id_raza = r.id_raza
        JOIN servicio s ON rs.id_servicio = s.id_servicio
        ORDER BY s.id_servicio, r.nombre_raza";
$res = mysqli_query($conn, $sql);

$servicios = [];
while ($row = mysqli_fetch_assoc($res)) {
    $servicios[] = $row;
}

echo json_encode(["ok" => true, "servicios" => $servicios]);

mysqli_close($conn);
?>