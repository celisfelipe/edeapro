<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = mysqli_connect("127.0.0.1", "root", "", "proyecto_act", 3306);
mysqli_set_charset($conn, "utf8mb4");

if (!$conn) {
    echo json_encode(["ok" => false, "error" => "Error conectando a la base de datos"]);
    exit;
}

$accion = $_GET['accion'] ?? '';

// Traer servicios con sus razas
if ($accion === 'servicios') {
    $sql = "SELECT r.id_raza, r.nombre_raza, s.id_servicio, s.nombre_servicio, 
                   rs.duracion, rs.precio
            FROM raza_servicio rs
            JOIN raza r ON rs.id_raza = r.id_raza
            JOIN servicio s ON rs.id_servicio = s.id_servicio
            ORDER BY s.id_servicio, r.nombre_raza";
    $res = mysqli_query($conn, $sql);
    $datos = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $datos[] = $row;
    }
    echo json_encode(["ok" => true, "servicios" => $datos]);
    exit;
}

// Traer adicionales
if ($accion === 'adicionales') {
    $res = mysqli_query($conn, "SELECT * FROM adicional");
    $datos = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $datos[] = $row;
    }
    echo json_encode(["ok" => true, "adicionales" => $datos]);
    exit;
}

// Traer estilistas
if ($accion === 'estilistas') {
    $res = mysqli_query($conn, "SELECT id_estilista, nombre_estilista, apellido_estilista FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
    $datos = [];
    while ($row = mysqli_fetch_assoc($res)) {
        $datos[] = $row;
    }
    echo json_encode(["ok" => true, "estilistas" => $datos]);
    exit;
}

// Traer slots ocupados por estilista y fecha
if ($accion === 'slots') {
    $id_estilista = intval($_GET['id_estilista']);
    $fecha        = $_GET['fecha'];

    $partes   = explode("/", $fecha);
    $fecha_bd = $partes[2] . "-" . str_pad($partes[1],2,"0",STR_PAD_LEFT) . "-" . str_pad($partes[0],2,"0",STR_PAD_LEFT);

    if ($id_estilista === 0) {
        $res_total = mysqli_query($conn, "SELECT COUNT(*) AS total FROM estilista WHERE estado = 'Activo' AND disponibilidad = 'Disponible'");
        $total_estilistas = mysqli_fetch_assoc($res_total)['total'];

        $sql = "SELECT c.hora, rs.duracion
                FROM cita c
                JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                WHERE c.fecha = '$fecha_bd' AND c.estado != 'Cancelada'";
    } else {
        $total_estilistas = 1;
        $sql = "SELECT c.hora, rs.duracion
                FROM cita c
                JOIN raza_servicio rs ON c.id_servicio = rs.id_servicio
                WHERE c.id_estilista = $id_estilista 
                AND c.fecha = '$fecha_bd'
                AND c.estado != 'Cancelada'";
    }

    $res = mysqli_query($conn, $sql);
    $slots_ocupados = [];

    while ($row = mysqli_fetch_assoc($res)) {
        $hora_inicio = strtotime($row['hora']);
        $duracion    = intval($row['duracion']);
        $hora_fin    = $hora_inicio + ($duracion * 60);

        $slot = $hora_inicio;
        while ($slot < $hora_fin) {
            $label = date('H:i', $slot);
            if (!isset($slots_ocupados[$label])) $slots_ocupados[$label] = 0;
            $slots_ocupados[$label]++;
            $slot += 1800;
        }
    }

    $ocupados = [];
    foreach ($slots_ocupados as $slot => $cantidad) {
        if ($cantidad >= $total_estilistas) {
            $ocupados[] = $slot;
        }
    }

    echo json_encode(["ok" => true, "ocupados" => $ocupados]);
    exit;
}

// Crear cita
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['accion'] === 'crear') {
    $id_cliente   = intval($_POST['id_cliente']);
    $id_estilista = intval($_POST['id_estilista']);
    $fecha        = $_POST['fecha'];
    $hora         = $_POST['hora'];
    $servicios    = json_decode($_POST['servicios'], true);
    $adicionales  = json_decode($_POST['adicionales'], true);

    $partes   = explode("/", $fecha);
    $fecha_bd = $partes[2] . "-" . str_pad($partes[1],2,"0",STR_PAD_LEFT) . "-" . str_pad($partes[0],2,"0",STR_PAD_LEFT);

    $res_m      = mysqli_query($conn, "SELECT id_mascota FROM mascota WHERE id_cliente = $id_cliente LIMIT 1");
    $mascota    = mysqli_fetch_assoc($res_m);
    $id_mascota = $mascota ? $mascota['id_mascota'] : null;

    if (!$id_mascota) {
        echo json_encode(["ok" => false, "error" => "El cliente no tiene mascotas registradas"]);
        exit;
    }

    $id_raza  = intval($servicios[0]);
    $res_s    = mysqli_query($conn, "SELECT id_servicio FROM raza_servicio WHERE id_raza = $id_raza LIMIT 1");
    $serv     = mysqli_fetch_assoc($res_s);

    if (!$serv) {
        echo json_encode(["ok" => false, "error" => "Servicio no encontrado para la raza $id_raza"]);
        exit;
    }

    $id_servicio = $serv['id_servicio'];

    $res_id  = mysqli_query($conn, "SELECT IFNULL(MAX(id_cita),0)+1 AS nuevo FROM cita");
    $id_cita = mysqli_fetch_assoc($res_id)['nuevo'];

    $sql = "INSERT INTO cita (id_cita, id_cliente, id_mascota, id_servicio, id_estilista, fecha, hora, estado)
            VALUES ($id_cita, $id_cliente, $id_mascota, $id_servicio, $id_estilista, '$fecha_bd', '$hora', 'Pendiente')";

    if (!mysqli_query($conn, $sql)) {
        echo json_encode(["ok" => false, "error" => mysqli_error($conn)]);
        exit;
    }

    foreach ($adicionales as $id_ad) {
        $id_ad = intval($id_ad);
        mysqli_query($conn, "INSERT INTO adicional_cita VALUES ($id_ad, $id_cita)");
    }

    echo json_encode(["ok" => true]);
    exit;
}

echo json_encode(["ok" => false, "error" => "Accion no válida"]);
mysqli_close($conn);
?>