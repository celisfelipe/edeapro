<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Citas por estado
$res = mysqli_query($conn, "SELECT estado, COUNT(*) AS total FROM cita GROUP BY estado");
$citas_estado = [];
while ($row = mysqli_fetch_assoc($res)) {
    $citas_estado[] = $row;
}

// Servicios mas solicitados
$res2 = mysqli_query($conn, "SELECT s.nombre_servicio, COUNT(*) AS total 
                              FROM cita c
                              JOIN servicio s ON c.id_servicio = s.id_servicio
                              GROUP BY s.nombre_servicio
                              ORDER BY total DESC");
$servicios = [];
while ($row = mysqli_fetch_assoc($res2)) {
    $servicios[] = $row;
}

// Ingresos totales
$res3 = mysqli_query($conn, "SELECT IFNULL(SUM(rs.precio), 0) AS total
                              FROM cita c
                              JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                              WHERE c.estado = 'Completada'
                              GROUP BY MONTH(c.fecha)");
$ingresos = [];
while ($row = mysqli_fetch_assoc($res3)) {
    $ingresos[] = $row;
}

// Total clientes
$res4 = mysqli_query($conn, "SELECT COUNT(*) AS total FROM cliente");
$total_clientes = mysqli_fetch_assoc($res4)['total'];

// Total citas
$res5 = mysqli_query($conn, "SELECT COUNT(*) AS total FROM cita");
$total_citas = mysqli_fetch_assoc($res5)['total'];

// Total ingresos
$res6 = mysqli_query($conn, "SELECT IFNULL(SUM(rs.precio), 0) AS total
                              FROM cita c
                              JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                              WHERE c.estado = 'Completada'");
$total_ingresos = mysqli_fetch_assoc($res6)['total'];

echo json_encode([
    "ok"             => true,
    "citas_estado"   => $citas_estado,
    "servicios"      => $servicios,
    "total_clientes" => $total_clientes,
    "total_citas"    => $total_citas,
    "total_ingresos" => $total_ingresos
]);

mysqli_close($conn);
?>