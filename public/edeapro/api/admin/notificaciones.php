<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Marcar como leída
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'leer') {
    $id  = intval($_POST['id_notificacion']);
    $sql = "UPDATE notificacion SET estado = 'Leída' WHERE id_notificacion = $id";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer notificaciones
$sql = "SELECT n.id_notificacion, n.titulo, n.mensaje, n.tipo, n.estado,
               c.nombre AS nombre_cliente, c.apellido AS apellido_cliente
        FROM notificacion n
        JOIN cliente c ON n.id_cliente = c.id_cliente
        ORDER BY n.id_notificacion DESC";
$res = mysqli_query($conn, $sql);

$notificaciones = [];
while ($row = mysqli_fetch_assoc($res)) {
    $notificaciones[] = $row;
}

echo json_encode(["ok" => true, "notificaciones" => $notificaciones]);

mysqli_close($conn);
?>