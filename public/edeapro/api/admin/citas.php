<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Cancelar cita
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id  = intval($_POST['id_cita']);
    $sql = "UPDATE cita SET estado = 'Cancelada' WHERE id_cita = $id";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer todas las citas
$sql = "SELECT * FROM citas_completas";
$res = mysqli_query($conn, $sql);

$citas = [];
while ($row = mysqli_fetch_assoc($res)) {
    $citas[] = $row;
}

echo json_encode(["ok" => true, "citas" => $citas]);

mysqli_close($conn);
?>