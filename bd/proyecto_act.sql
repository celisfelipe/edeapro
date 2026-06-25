-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 25-06-2026 a las 07:25:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `proyecto_act`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `adicional`
--

CREATE TABLE `adicional` (
  `id_adicional` int(11) NOT NULL,
  `nombre_adicional` varchar(30) DEFAULT NULL,
  `precio_adicional` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `adicional`
--

INSERT INTO `adicional` (`id_adicional`, `nombre_adicional`, `precio_adicional`) VALUES
(1, 'Hidratación de pelaje', 15000.00),
(2, 'Corte de uñas', 10000.00),
(3, 'Desenredado mayor a 30 mins', 15000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `adicional_cita`
--

CREATE TABLE `adicional_cita` (
  `id_adicional` int(11) NOT NULL,
  `id_cita` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Disparadores `adicional_cita`
--
DELIMITER $$
CREATE TRIGGER `adicional_cita_unico` BEFORE INSERT ON `adicional_cita` FOR EACH ROW BEGIN
    IF (SELECT COUNT(*) 
        FROM adicional_cita 
        WHERE id_adicional = NEW.id_adicional
        AND id_cita = NEW.id_cita) > 0 THEN
        
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ese adicional ya está agregado a esta cita.';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('edeapro-cache-5c785c036466adea360111aa28563bfd556b5fba', 'i:1;', 1782155024),
('edeapro-cache-5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1782155024;', 1782155024);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cita`
--

CREATE TABLE `cita` (
  `id_cita` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_mascota` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `id_estilista` int(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `estado` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cita`
--

INSERT INTO `cita` (`id_cita`, `id_cliente`, `id_mascota`, `id_servicio`, `id_estilista`, `fecha`, `hora`, `estado`) VALUES
(1, 1, 1, 1, 2, '2026-04-15', '09:30:00', 'Cancelada'),
(2, 3, 2, 1, 1, '2026-05-14', '09:00:00', 'Cancelada'),
(7, 3, 2, 1, 2, '2026-05-08', '11:00:00', 'Cancelada'),
(8, 3, 2, 1, 1, '2026-05-11', '11:30:00', 'Cancelada'),
(9, 3, 2, 1, 2, '2026-05-09', '09:00:00', 'Cancelada'),
(10, 3, 2, 1, 2, '2026-05-09', '09:00:00', 'Cancelada'),
(11, 3, 2, 1, 3, '2026-05-19', '11:30:00', 'Cancelada'),
(12, 3, 2, 2, 2, '2026-05-27', '09:00:00', 'Cancelada'),
(13, 3, 2, 1, 2, '2026-05-28', '09:00:00', 'Cancelada'),
(14, 3, 2, 2, 3, '2026-05-29', '09:00:00', 'Cancelada');

--
-- Disparadores `cita`
--
DELIMITER $$
CREATE TRIGGER `cita_horario_valido` BEFORE INSERT ON `cita` FOR EACH ROW BEGIN
    IF NEW.hora < '09:00:00' OR NEW.hora > '17:00:00' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Las citas solo pueden agendarse entre las 9:00 y 17:00.';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `estilista_disponible` AFTER UPDATE ON `cita` FOR EACH ROW BEGIN
    IF NEW.estado = 'Cancelada' AND OLD.estado <> 'Cancelada' THEN
        UPDATE estilista
        SET disponibilidad = 'Disponible'
        WHERE id_estilista = NEW.id_estilista;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_notificacion_cita` AFTER INSERT ON `cita` FOR EACH ROW INSERT INTO notificacion(id_notificacion, id_cita, id_cliente, mensaje, tipo, titulo, estado)
VALUES (
    (SELECT IFNULL(MAX(n.id_notificacion), 0) + 1 FROM notificacion n),
    NEW.id_cita,
    NEW.id_cliente,
    CONCAT('Tu cita fue agendada para el ', NEW.fecha, ' a las ', NEW.hora),
    'Recordatorio',
    'Cita registrada',
    'No leída'
)
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `citas_completas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `citas_completas` (
`id_cita` int(11)
,`nombre_cliente` varchar(30)
,`apellido_cliente` varchar(30)
,`mascota` varchar(20)
,`nombre_servicio` varchar(30)
,`nombre_estilista` varchar(30)
,`fecha` date
,`hora` time
,`estado` varchar(20)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `id_cliente` int(11) NOT NULL,
  `nombre` varchar(30) DEFAULT NULL,
  `apellido` varchar(30) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `correo` varchar(30) DEFAULT NULL,
  `direccion` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cliente`
--

INSERT INTO `cliente` (`id_cliente`, `nombre`, `apellido`, `contrasena`, `telefono`, `correo`, `direccion`) VALUES
(1, 'jose', 'lopez', '$2y$12$ueMwAeEv98tT2zlK2Rww0ukGvkCtOy/h0DZAG3cYRMYe7jwpMaZKy', '3218403116', 'pruebaedea15@gmail.com', ''),
(3, 'felipe', 'celis', '$2y$12$fw.QWaajsKEovi45Gi0CBeYdScM/Iu4azyb6qa5F/O.imOm1giw86', '3502802461', 'felipe@gmail.com', NULL),
(4, 'fernada', 'avendaño', '$2y$12$fLVPWt7DSzMXqJZqa5kvIe5LhLZv78QROx0bWwxzB.YkRc4t2eH9a', '3218403565', 'fernanda@gmail.com', NULL),
(5, 'blessd', 'el bendito', '$2y$12$ULngQhzgrspQkl4oFoq.cOwpjplD9ttK3OQ4etEM3Ru4Bwb/OMH6u', '3156459812', 'blessd@gmail.com', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente_promocion`
--

CREATE TABLE `cliente_promocion` (
  `id_cliente` int(11) NOT NULL,
  `id_promocion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estilista`
--

CREATE TABLE `estilista` (
  `id_estilista` int(11) NOT NULL,
  `nombre_estilista` varchar(30) DEFAULT NULL,
  `apellido_estilista` varchar(30) DEFAULT NULL,
  `telefono_estilista` varchar(30) DEFAULT NULL,
  `rol` varchar(20) DEFAULT NULL,
  `estado` varchar(20) DEFAULT NULL,
  `disponibilidad` varchar(20) DEFAULT NULL,
  `correo` varchar(50) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estilista`
--

INSERT INTO `estilista` (`id_estilista`, `nombre_estilista`, `apellido_estilista`, `telefono_estilista`, `rol`, `estado`, `disponibilidad`, `correo`, `contrasena`) VALUES
(1, 'Santiago', 'Torres', '3127896540', 'Administrador', 'Activo', 'Disponible', 'santiago@edea.com', '$2y$12$o50ctPKWMgKje7OKz0blqO8hTP1j/vTxVWq1B9GMbkL/RQX/H9Uue'),
(2, 'Paola', 'Díaz', '3119876543', 'Peluquero', 'Activo', 'Disponible', 'paola@edea.com', '$2y$12$i1ALdsf64X/D5N1ZqZAJm.F4K9P1k684PnlpkyDJmlPstQ9ngfLna'),
(3, 'Carlos', 'Pérez', '3006547891', 'Peluquero', 'Activo', 'Disponible', 'carlos@edea.com', '$2y$12$/D.5EhHAWyEcCMBkPiw/AO4E1tVqOw3T1CczQW6YQRXRWWfLaZkPK');

--
-- Disparadores `estilista`
--
DELIMITER $$
CREATE TRIGGER `estilista_rol_mayusculas` BEFORE INSERT ON `estilista` FOR EACH ROW BEGIN
    SET NEW.rol = UPPER(NEW.rol);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mascota`
--

CREATE TABLE `mascota` (
  `id_mascota` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `id_raza` int(11) DEFAULT NULL,
  `nombre` varchar(20) DEFAULT NULL,
  `especie` varchar(20) DEFAULT NULL,
  `edad` int(11) DEFAULT NULL,
  `genero` char(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mascota`
--

INSERT INTO `mascota` (`id_mascota`, `id_cliente`, `id_raza`, `nombre`, `especie`, `edad`, `genero`) VALUES
(1, 1, NULL, 'penelope', 'Canino', 3, 'Hembra'),
(2, 3, NULL, 'max', 'perro', 10, 'macho'),
(3, 4, NULL, 'lucas', 'perro', 10, 'macho'),
(4, 4, NULL, 'luna', 'gato', 5, 'hembra'),
(5, 5, NULL, 'loco', 'gato', 2, 'macho');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `mascotas_clientes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `mascotas_clientes` (
`id_mascota` int(11)
,`nombre_mascotas` varchar(20)
,`especie` varchar(20)
,`edad` int(11)
,`nombre_cliente` varchar(30)
,`apellido_cliente` varchar(30)
,`nombre_raza` varchar(30)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `mascotas_servicios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `mascotas_servicios` (
`id_cliente` int(11)
,`nombre_cliente` varchar(30)
,`nombre_mascotas` varchar(20)
,`raza` varchar(30)
,`nombre_servicio` varchar(30)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_04_29_031058_create_personal_access_tokens_table', 2);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `id_notificacion` int(11) NOT NULL,
  `id_cita` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `mensaje` varchar(200) DEFAULT NULL,
  `tipo` varchar(30) DEFAULT NULL,
  `titulo` varchar(30) DEFAULT NULL,
  `estado` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificacion`
--

INSERT INTO `notificacion` (`id_notificacion`, `id_cita`, `id_cliente`, `mensaje`, `tipo`, `titulo`, `estado`) VALUES
(1, 1, 1, 'Tu cita fue agendada para el 2026-04-15 a las 09:30:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(2, 2, 3, 'Tu cita fue agendada para el 2026-05-14 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(3, 7, 3, 'Tu cita fue agendada para el 2026-05-08 a las 11:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(4, 8, 3, 'Tu cita fue agendada para el 2026-05-11 a las 11:30:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(5, 9, 3, 'Tu cita fue agendada para el 2026-05-09 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(6, 10, 3, 'Tu cita fue agendada para el 2026-05-09 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(7, 11, 3, 'Tu cita fue agendada para el 2026-05-19 a las 11:30:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(8, 12, 3, 'Tu cita fue agendada para el 2026-05-27 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(9, 13, 3, 'Tu cita fue agendada para el 2026-05-28 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída'),
(10, 14, 3, 'Tu cita fue agendada para el 2026-05-29 a las 09:00:00', 'Recordatorio', 'Cita registrada', 'Leída');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `notificaciones_clientes`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `notificaciones_clientes` (
`id_notificacion` int(11)
,`nombre` varchar(30)
,`apellido` varchar(30)
,`titulo` varchar(30)
,`mensaje` varchar(200)
,`tipo` varchar(30)
,`estado` varchar(30)
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pago`
--

CREATE TABLE `pago` (
  `id_pago` int(11) NOT NULL,
  `id_cita` int(11) NOT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `fecha_pago` date DEFAULT NULL,
  `metodo_pago` varchar(40) DEFAULT NULL,
  `estado_pago` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pago`
--

INSERT INTO `pago` (`id_pago`, `id_cita`, `monto`, `fecha_pago`, `metodo_pago`, `estado_pago`) VALUES
(1, 7, NULL, '2026-05-09', 'Efectivo', 'Completado'),
(2, 10, NULL, '2026-05-09', 'Tarjeta de crédito', 'Completado');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `pagos_citas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `pagos_citas` (
`id_pago` int(11)
,`fecha_pago` date
,`metodo_pago` varchar(40)
,`estado_pago` varchar(20)
,`id_cita` int(11)
,`fecha` date
,`hora` time
);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(12, 'cliente', 4, 'auth_token', '2b28c25c4eb5cd1fce8c0e22d9e983e16c34b980f7d00b1d54c40b5634125ef6', '[\"cliente\"]', NULL, '2026-06-15 07:16:12', '2026-06-14 07:16:12', '2026-06-14 07:16:12'),
(13, 'cliente', 5, 'auth_token', '6c1a966d95f9b2b1d2093bc6e409eebfe6a2e6ea686dfff4b2ae222b34d18545', '[\"cliente\"]', NULL, '2026-06-15 07:18:48', '2026-06-14 07:18:48', '2026-06-14 07:18:48'),
(44, 'cliente', 3, 'auth_token', '3b01b59df1f72b0f249bfcae27dc9dbc3bb1d3c31b9c09b4899640e2a59f301b', '[\"cliente\"]', NULL, '2026-06-23 23:58:14', '2026-06-22 23:58:14', '2026-06-22 23:58:14'),
(45, 'estilista', 1, 'auth_token', 'a5029bec582f38df2b1742682de243bf6ba3d90f71c4297bb2fe32e49febe060', '[\"administrador\"]', NULL, '2026-06-23 23:59:54', '2026-06-22 23:59:54', '2026-06-22 23:59:54'),
(46, 'estilista', 2, 'auth_token', '9e20a1d9c68fcaa282f730eec6136ea231f537847ee15bafbad4ad67ec03909c', '[\"peluquero\"]', NULL, '2026-06-24 00:02:44', '2026-06-23 00:02:44', '2026-06-23 00:02:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `promocion`
--

CREATE TABLE `promocion` (
  `id_promocion` int(11) NOT NULL,
  `nombre_promocion` varchar(30) DEFAULT NULL,
  `valor_promocion` decimal(5,2) DEFAULT NULL,
  `estado_promocion` varchar(30) DEFAULT NULL,
  `tipo_promocion` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `promocion`
--

INSERT INTO `promocion` (`id_promocion`, `nombre_promocion`, `valor_promocion`, `estado_promocion`, `tipo_promocion`) VALUES
(1, 'Descuento por cumpleaños', 0.10, 'Activa', 'Cumpleaños'),
(2, 'Cliente frecuente', 0.15, 'Activa', 'Fidelidad'),
(3, 'Promoción de temporada', 0.20, 'Inactiva', 'Temporal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `raza`
--

CREATE TABLE `raza` (
  `id_raza` int(11) NOT NULL,
  `nombre_raza` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `raza`
--

INSERT INTO `raza` (`id_raza`, `nombre_raza`) VALUES
(1, 'Bulldog Francés'),
(2, 'Doberman'),
(3, 'Boston Terrier'),
(4, 'Beagle'),
(5, 'Boxer'),
(6, 'Bull Terrier'),
(7, 'Bulldog Inglés'),
(8, 'American Bully Pocket'),
(9, 'American Bully Standar'),
(10, 'American Bully XL'),
(11, 'Fox Terrier'),
(12, 'Jack Russell'),
(13, 'Labrador'),
(14, 'Pug'),
(15, 'Pitbull'),
(16, 'Pincher - Chihuahua'),
(17, 'Teckel'),
(18, 'Rottweiler'),
(19, 'Chow Chow'),
(20, 'Grifón de Bruselas'),
(21, 'Pastor Collie'),
(22, 'Maltipoo'),
(23, 'Bernés de la Montaña'),
(24, 'Akita Americano'),
(25, 'Border Collie'),
(26, 'Corgi'),
(27, 'Cocker Spaniel'),
(28, 'Golden Retriever'),
(29, 'Goldendoodle - Labradoodle'),
(30, 'Husky'),
(31, 'Maltés'),
(32, 'Pomerania'),
(33, 'Pomsky'),
(34, 'Pastor Belga'),
(35, 'Pastor Alemán'),
(36, 'Pastor Australiano'),
(37, 'Poodle'),
(38, 'Shetland'),
(39, 'Shih Tzu Especializado'),
(40, 'Pomerania Especializado'),
(41, 'Stripping Airedale Terrier'),
(42, 'Stripping Jack Russell'),
(43, 'Stripping Scottish Terrier'),
(44, 'Stripping Teckel'),
(45, 'Stripping West Highland White'),
(46, 'Gato pelo corto'),
(47, 'Gato persa');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `raza_servicio`
--

CREATE TABLE `raza_servicio` (
  `id_raza` int(11) NOT NULL,
  `id_servicio` int(11) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `duracion` varchar(30) DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `raza_servicio`
--

INSERT INTO `raza_servicio` (`id_raza`, `id_servicio`, `descripcion`, `duracion`, `precio`) VALUES
(1, 1, NULL, '45 min', 58900.00),
(2, 1, NULL, '60 min', 65000.00),
(3, 1, NULL, '45 min', 58000.00),
(4, 1, NULL, '45 min', 58000.00),
(5, 1, NULL, '60 min', 65000.00),
(6, 1, NULL, '45 min', 58000.00),
(7, 1, NULL, '45 min', 58900.00),
(8, 1, NULL, '48 min', 55000.00),
(9, 1, NULL, '60 min', 68000.00),
(10, 1, NULL, '75 min', 78000.00),
(11, 1, NULL, '45 min', 58000.00),
(12, 1, NULL, '45 min', 58000.00),
(13, 1, NULL, '60 min', 72000.00),
(14, 1, NULL, '45 min', 58000.00),
(15, 1, NULL, '60 min', 65000.00),
(16, 1, NULL, '45 min', 55000.00),
(17, 1, NULL, '45 min', 58000.00),
(18, 1, NULL, '75 min', 78000.00),
(19, 2, NULL, '180 min', 120000.00),
(20, 2, NULL, '60 min', 65000.00),
(21, 2, NULL, '150 min', 98000.00),
(22, 2, NULL, '120 min', 88000.00),
(23, 2, NULL, '180 min', 120000.00),
(24, 2, NULL, '150 min', 98000.00),
(25, 2, NULL, '120 min', 88000.00),
(26, 2, NULL, '90 min', 78000.00),
(27, 2, NULL, '120 min', 88000.00),
(28, 2, NULL, '180 min', 98000.00),
(29, 2, NULL, '150 min', 98000.00),
(30, 2, NULL, '150 min', 98000.00),
(31, 2, NULL, '120 min', 82000.00),
(32, 2, NULL, '120 min', 84000.00),
(33, 2, NULL, '150 min', 98000.00),
(34, 2, NULL, '150 min', 98000.00),
(35, 2, NULL, '150 min', 98000.00),
(36, 2, NULL, '120 min', 88000.00),
(37, 2, NULL, '150 min', 88000.00),
(38, 2, NULL, '120 min', 84000.00),
(39, 3, NULL, '150 min', 84000.00),
(40, 3, NULL, '120 min', 85000.00),
(41, 3, NULL, '120 min', 90000.00),
(42, 3, NULL, '90 min', 80000.00),
(43, 3, NULL, '90 min', 80000.00),
(44, 3, NULL, '90 min', 80000.00),
(45, 3, NULL, '90 min', 80000.00),
(46, 4, NULL, '60 min', 70000.00),
(47, 4, NULL, '120 min', 90000.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `resena`
--

CREATE TABLE `resena` (
  `id_resena` int(11) NOT NULL,
  `id_cliente` int(11) NOT NULL,
  `puntuacion` int(11) NOT NULL CHECK (`puntuacion` between 1 and 5),
  `comentario` text NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `resena`
--

INSERT INTO `resena` (`id_resena`, `id_cliente`, `puntuacion`, `comentario`, `fecha`) VALUES
(1, 3, 5, 'Gran servicio', '2026-05-23 20:08:37');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicio`
--

CREATE TABLE `servicio` (
  `id_servicio` int(11) NOT NULL,
  `nombre_servicio` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicio`
--

INSERT INTO `servicio` (`id_servicio`, `nombre_servicio`) VALUES
(1, 'Pelo corto'),
(2, 'Pelo largo-doble capa'),
(3, 'Corte especializado'),
(4, 'Gatos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('8HiDrANi9UFFUITFp87Ov37OIQ3mvR9Bjacjn9cA', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoia2hYN29IN0dxRHZBY0dXTXM2U0lxVVVzQ0RLUG9sRUIwY3QwQWhqayI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1778045515),
('cPCHLQxrOOK14jqeUMuiKEOMi2wGMa8jAY0pBM2b', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTXJCbkowSjJhZm1KbFhSMjhEVzZQalNhVkd2cUhQMWJuZ0FaVUZ6eSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1777426615),
('D2QHcIqvrbcqBT1oLfOVcwq9twYhRNDRM7vmnFwd', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieVp5Nk1UY0JPekNyak9kZm1YVENEbmlFdW04QkxMZG5pQXlIcFFJcyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1778043780),
('Z8XaiQfO7iF7HaOIhGykW5pq3maPLJeZDK5UkqVP', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZlVyeG5MeUR2cXBQaUc2NUk3RHBwNlhPVDBzRjRoa2pqSjAzNlREciI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1777963541);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura para la vista `citas_completas`
--
DROP TABLE IF EXISTS `citas_completas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `citas_completas`  AS SELECT `c`.`id_cita` AS `id_cita`, `cl`.`nombre` AS `nombre_cliente`, `cl`.`apellido` AS `apellido_cliente`, `m`.`nombre` AS `mascota`, `s`.`nombre_servicio` AS `nombre_servicio`, `e`.`nombre_estilista` AS `nombre_estilista`, `c`.`fecha` AS `fecha`, `c`.`hora` AS `hora`, `c`.`estado` AS `estado` FROM ((((`cita` `c` join `cliente` `cl` on(`c`.`id_cliente` = `cl`.`id_cliente`)) join `mascota` `m` on(`c`.`id_mascota` = `m`.`id_mascota`)) join `servicio` `s` on(`c`.`id_servicio` = `s`.`id_servicio`)) join `estilista` `e` on(`c`.`id_estilista` = `e`.`id_estilista`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `mascotas_clientes`
--
DROP TABLE IF EXISTS `mascotas_clientes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mascotas_clientes`  AS SELECT `m`.`id_mascota` AS `id_mascota`, `m`.`nombre` AS `nombre_mascotas`, `m`.`especie` AS `especie`, `m`.`edad` AS `edad`, `cl`.`nombre` AS `nombre_cliente`, `cl`.`apellido` AS `apellido_cliente`, `r`.`nombre_raza` AS `nombre_raza` FROM ((`mascota` `m` join `cliente` `cl` on(`m`.`id_cliente` = `cl`.`id_cliente`)) join `raza` `r` on(`m`.`id_raza` = `r`.`id_raza`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `mascotas_servicios`
--
DROP TABLE IF EXISTS `mascotas_servicios`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `mascotas_servicios`  AS SELECT `cl`.`id_cliente` AS `id_cliente`, `cl`.`nombre` AS `nombre_cliente`, `m`.`nombre` AS `nombre_mascotas`, `r`.`nombre_raza` AS `raza`, `s`.`nombre_servicio` AS `nombre_servicio` FROM (((`cliente` `cl` join `mascota` `m` on(`m`.`id_cliente` = `cl`.`id_cliente`)) join `raza` `r` on(`m`.`id_raza` = `r`.`id_raza`)) join `servicio` `s` on(`m`.`id_mascota` = `s`.`id_servicio`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `notificaciones_clientes`
--
DROP TABLE IF EXISTS `notificaciones_clientes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `notificaciones_clientes`  AS SELECT `n`.`id_notificacion` AS `id_notificacion`, `cl`.`nombre` AS `nombre`, `cl`.`apellido` AS `apellido`, `n`.`titulo` AS `titulo`, `n`.`mensaje` AS `mensaje`, `n`.`tipo` AS `tipo`, `n`.`estado` AS `estado` FROM (`notificacion` `n` join `cliente` `cl` on(`n`.`id_cliente` = `cl`.`id_cliente`)) ;

-- --------------------------------------------------------

--
-- Estructura para la vista `pagos_citas`
--
DROP TABLE IF EXISTS `pagos_citas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `pagos_citas`  AS SELECT `p`.`id_pago` AS `id_pago`, `p`.`fecha_pago` AS `fecha_pago`, `p`.`metodo_pago` AS `metodo_pago`, `p`.`estado_pago` AS `estado_pago`, `c`.`id_cita` AS `id_cita`, `c`.`fecha` AS `fecha`, `c`.`hora` AS `hora` FROM (`pago` `p` join `cita` `c` on(`p`.`id_cita` = `c`.`id_cita`)) ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `adicional`
--
ALTER TABLE `adicional`
  ADD PRIMARY KEY (`id_adicional`);

--
-- Indices de la tabla `adicional_cita`
--
ALTER TABLE `adicional_cita`
  ADD PRIMARY KEY (`id_adicional`,`id_cita`),
  ADD KEY `id_cita` (`id_cita`);

--
-- Indices de la tabla `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indices de la tabla `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indices de la tabla `cita`
--
ALTER TABLE `cita`
  ADD PRIMARY KEY (`id_cita`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_mascota` (`id_mascota`),
  ADD KEY `id_servicio` (`id_servicio`),
  ADD KEY `id_estilista` (`id_estilista`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id_cliente`);

--
-- Indices de la tabla `cliente_promocion`
--
ALTER TABLE `cliente_promocion`
  ADD PRIMARY KEY (`id_cliente`,`id_promocion`),
  ADD KEY `id_promocion` (`id_promocion`);

--
-- Indices de la tabla `estilista`
--
ALTER TABLE `estilista`
  ADD PRIMARY KEY (`id_estilista`);

--
-- Indices de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indices de la tabla `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indices de la tabla `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mascota`
--
ALTER TABLE `mascota`
  ADD PRIMARY KEY (`id_mascota`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_raza` (`id_raza`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_cita` (`id_cita`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `pago`
--
ALTER TABLE `pago`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_cita` (`id_cita`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indices de la tabla `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indices de la tabla `promocion`
--
ALTER TABLE `promocion`
  ADD PRIMARY KEY (`id_promocion`);

--
-- Indices de la tabla `raza`
--
ALTER TABLE `raza`
  ADD PRIMARY KEY (`id_raza`);

--
-- Indices de la tabla `raza_servicio`
--
ALTER TABLE `raza_servicio`
  ADD PRIMARY KEY (`id_servicio`,`id_raza`),
  ADD KEY `id_raza` (`id_raza`);

--
-- Indices de la tabla `resena`
--
ALTER TABLE `resena`
  ADD PRIMARY KEY (`id_resena`),
  ADD KEY `id_cliente` (`id_cliente`);

--
-- Indices de la tabla `servicio`
--
ALTER TABLE `servicio`
  ADD PRIMARY KEY (`id_servicio`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `cita`
--
ALTER TABLE `cita`
  MODIFY `id_cita` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id_cliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `estilista`
--
ALTER TABLE `estilista`
  MODIFY `id_estilista` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mascota`
--
ALTER TABLE `mascota`
  MODIFY `id_mascota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `pago`
--
ALTER TABLE `pago`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT de la tabla `resena`
--
ALTER TABLE `resena`
  MODIFY `id_resena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `adicional_cita`
--
ALTER TABLE `adicional_cita`
  ADD CONSTRAINT `adicional_cita_ibfk_1` FOREIGN KEY (`id_adicional`) REFERENCES `adicional` (`id_adicional`),
  ADD CONSTRAINT `adicional_cita_ibfk_2` FOREIGN KEY (`id_cita`) REFERENCES `cita` (`id_cita`);

--
-- Filtros para la tabla `cita`
--
ALTER TABLE `cita`
  ADD CONSTRAINT `cita_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  ADD CONSTRAINT `cita_ibfk_2` FOREIGN KEY (`id_mascota`) REFERENCES `mascota` (`id_mascota`),
  ADD CONSTRAINT `cita_ibfk_3` FOREIGN KEY (`id_servicio`) REFERENCES `servicio` (`id_servicio`),
  ADD CONSTRAINT `cita_ibfk_4` FOREIGN KEY (`id_estilista`) REFERENCES `estilista` (`id_estilista`);

--
-- Filtros para la tabla `cliente_promocion`
--
ALTER TABLE `cliente_promocion`
  ADD CONSTRAINT `cliente_promocion_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  ADD CONSTRAINT `cliente_promocion_ibfk_2` FOREIGN KEY (`id_promocion`) REFERENCES `promocion` (`id_promocion`);

--
-- Filtros para la tabla `mascota`
--
ALTER TABLE `mascota`
  ADD CONSTRAINT `mascota_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  ADD CONSTRAINT `mascota_ibfk_2` FOREIGN KEY (`id_raza`) REFERENCES `raza` (`id_raza`);

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `cita` (`id_cita`),
  ADD CONSTRAINT `notificacion_ibfk_2` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`);

--
-- Filtros para la tabla `pago`
--
ALTER TABLE `pago`
  ADD CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`id_cita`) REFERENCES `cita` (`id_cita`);

--
-- Filtros para la tabla `raza_servicio`
--
ALTER TABLE `raza_servicio`
  ADD CONSTRAINT `raza_servicio_ibfk_1` FOREIGN KEY (`id_servicio`) REFERENCES `servicio` (`id_servicio`),
  ADD CONSTRAINT `raza_servicio_ibfk_2` FOREIGN KEY (`id_raza`) REFERENCES `raza` (`id_raza`);

--
-- Filtros para la tabla `resena`
--
ALTER TABLE `resena`
  ADD CONSTRAINT `resena_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
