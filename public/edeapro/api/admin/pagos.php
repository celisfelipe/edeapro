<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Registrar pago
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'registrar') {
    $id_cita   = intval($_POST['id_cita']);
    $metodo    = $_POST['metodo'];
    $fecha     = date('Y-m-d');

    $res_id  = mysqli_query($conn, "SELECT IFNULL(MAX(id_pago),0)+1 AS nuevo FROM pago");
    $id_pago = mysqli_fetch_assoc($res_id)['nuevo'];

    $sql = "INSERT INTO pago (id_pago, id_cita, fecha_pago, metodo_pago, estado_pago)
            VALUES ($id_pago, $id_cita, '$fecha', '$metodo', 'Completado')";

    if (mysqli_query($conn, $sql)) {
        // Actualizar estado de la cita a Completada
        mysqli_query($conn, "UPDATE cita SET estado = 'Completada' WHERE id_cita = $id_cita");
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer pagos
$sql = "SELECT p.id_pago, p.fecha_pago, p.metodo_pago, p.estado_pago,
               c.nombre AS nombre_cliente, c.apellido AS apellido_cliente,
               s.nombre_servicio, ci.id_cita
        FROM pago p
        JOIN cita ci ON p.id_cita = ci.id_cita
        JOIN cliente c ON ci.id_cliente = c.id_cliente
        JOIN servicio s ON ci.id_servicio = s.id_servicio
        ORDER BY p.id_pago DESC";
$res = mysqli_query($conn, $sql);

$pagos = [];
while ($row = mysqli_fetch_assoc($res)) {
    $pagos[] = $row;
}

echo json_encode(["ok" => true, "pagos" => $pagos]);

mysqli_close($conn);
?>