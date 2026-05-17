<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Eliminar cliente
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'eliminar') {
    $id = intval($_POST['id_cliente']);
    mysqli_query($conn, "DELETE FROM adicional_cita WHERE id_cita IN (SELECT id_cita FROM cita WHERE id_cliente = $id)");
    mysqli_query($conn, "DELETE FROM notificacion WHERE id_cliente = $id");
    mysqli_query($conn, "DELETE FROM pago WHERE id_cita IN (SELECT id_cita FROM cita WHERE id_cliente = $id)");
    mysqli_query($conn, "DELETE FROM cita WHERE id_cliente = $id");
    mysqli_query($conn, "DELETE FROM mascota WHERE id_cliente = $id");
    mysqli_query($conn, "DELETE FROM cliente_promocion WHERE id_cliente = $id");
    if (mysqli_query($conn, "DELETE FROM cliente WHERE id_cliente = $id")) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Editar cliente
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'editar') {
    $id       = intval($_POST['id_cliente']);
    $nombre   = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $telefono = $_POST['telefono'];
    $correo   = $_POST['correo'];

    $sql = "UPDATE cliente SET nombre='$nombre', apellido='$apellido', telefono='$telefono', correo='$correo' WHERE id_cliente = $id";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer clientes
$sql = "SELECT id_cliente, nombre, apellido, telefono, correo FROM cliente";
$res = mysqli_query($conn, $sql);

$clientes = [];
while ($row = mysqli_fetch_assoc($res)) {
    $clientes[] = $row;
}

echo json_encode(["ok" => true, "clientes" => $clientes]);

mysqli_close($conn);
?>