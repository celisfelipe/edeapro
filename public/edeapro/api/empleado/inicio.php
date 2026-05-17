<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

$id_estilista = intval($_GET['id_estilista']);

$sql = "SELECT c.id_cita, c.fecha, c.hora, c.estado,
               cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
               s.nombre_servicio
        FROM cita c
        JOIN cliente cl ON c.id_cliente = cl.id_cliente
        JOIN servicio s ON c.id_servicio = s.id_servicio
        WHERE c.id_estilista = $id_estilista
        ORDER BY c.fecha DESC, c.hora DESC";

$res = mysqli_query($conn, $sql);
$citas = [];
while ($row = mysqli_fetch_assoc($res)) {
    $citas[] = $row;
}

echo json_encode(["ok" => true, "citas" => $citas]);

mysqli_close($conn);
?>