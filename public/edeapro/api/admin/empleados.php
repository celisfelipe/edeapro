<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

// Eliminar empleado
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'eliminar') {
    $id  = intval($_POST['id_estilista']);
    $sql = "DELETE FROM estilista WHERE id_estilista = $id";
    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Agregar empleado
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'agregar') {
    $nombre    = $_POST['nombre'];
    $apellido  = $_POST['apellido'];
    $telefono  = $_POST['telefono'];
    $correo    = $_POST['correo'];
    $contrasena = $_POST['contrasena'];
    $rol       = $_POST['rol'];

    $res_id  = mysqli_query($conn, "SELECT IFNULL(MAX(id_estilista),0)+1 AS nuevo FROM estilista");
    $id      = mysqli_fetch_assoc($res_id)['nuevo'];

    $sql = "INSERT INTO estilista (id_estilista, nombre_estilista, apellido_estilista, telefono_estilista, rol, estado, disponibilidad, correo, contrasena)
            VALUES ($id, '$nombre', '$apellido', '$telefono', '$rol', 'Activo', 'Disponible', '$correo', '$contrasena')";

    if (mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => true]);
    } else {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
    }
    exit;
}

// Traer empleados
$sql = "SELECT id_estilista, nombre_estilista, apellido_estilista, telefono_estilista, rol, estado, correo FROM estilista";
$res = mysqli_query($conn, $sql);

$empleados = [];
while ($row = mysqli_fetch_assoc($res)) {
    $empleados[] = $row;
}

echo json_encode(["ok" => true, "empleados" => $empleados]);

mysqli_close($conn);
?>