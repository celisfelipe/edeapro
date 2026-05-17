<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Traer citas del dia seleccionado
$fecha = $_GET['fecha'] ?? date('Y-m-d');

$sql = "SELECT c.id_cita, c.hora, c.estado,
               cl.nombre AS nombre_cliente, cl.apellido AS apellido_cliente,
               r.nombre_raza, rs.duracion,
               e.id_estilista, e.nombre_estilista
        FROM cita c
        JOIN cliente cl ON c.id_cliente = cl.id_cliente
        JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
        JOIN raza r ON rs.id_raza = r.id_raza
        JOIN estilista e ON c.id_estilista = e.id_estilista
        WHERE c.fecha = '$fecha' AND c.estado != 'Cancelada'";

$res = mysqli_query($conn, $sql);
$citas = [];
while ($row = mysqli_fetch_assoc($res)) {
    $citas[] = $row;
}

// Traer estilistas activos
$res = mysqli_query($conn, "SELECT id_estilista, nombre_estilista, apellido_estilista, disponibilidad FROM estilista WHERE estado = 'Activo'");
$estilistas = [];
while ($row = mysqli_fetch_assoc($res)) {
    $estilistas[] = $row;
}

// Cambiar disponibilidad estilista
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'disponibilidad') {
    $id            = intval($_POST['id_estilista']);
    $disponibilidad = $_POST['disponibilidad'];

    $sql = "UPDATE estilista SET disponibilidad = '$disponibilidad' WHERE id_estilista = $id";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

echo json_encode(["ok" => true, "citas" => $citas, "estilistas" => $estilistas]);

mysqli_close($conn);
?>