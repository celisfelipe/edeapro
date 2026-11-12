graph TD
    CLI_MODULE["Modulo Cliente - perfil.html"]

    CLI_MODULE --> SEC_PERFIL["Perfil Personal"]
    CLI_MODULE --> SEC_PETS["Mis Mascotas"]
    CLI_MODULE --> SEC_CITAS["Mis Citas"]
    CLI_MODULE --> SEC_PAGOS["Mis Pagos"]

    SEC_PERFIL --> P1["Ver y Editar Datos Personales"]
    SEC_PERFIL --> P2["Cambiar Contrasena"]
    SEC_PERFIL --> P3["Cerrar Sesion - Logout"]

    SEC_PETS --> PET1["Lista de Mascotas Registradas"]
    SEC_PETS --> PET2["Registrar Nueva Mascota"]
    SEC_PETS --> PET3["Editar o Eliminar Mascota"]

    SEC_CITAS --> C1["Ver Historial y Proximas Citas"]
    SEC_CITAS --> C2["Reagendar Cita"]
    SEC_CITAS --> C3["Cancelar Cita"]
    SEC_CITAS --> C4["Agendar Nueva Cita"]

    C4 -.->|Redirige| PUB_AGENDA["paginas/agenda.html"]

    SEC_PAGOS --> PAG1["Historial de Transacciones"]
    SEC_PAGOS --> PAG2["Ver Comprobantes"]
    SEC_PAGOS --> PAG3["Estado de Pagos"]

    subgraph API_INTEGRATION ["Endpoints API Cliente Laravel"]
        API_AUTH["POST /api/logout"]
        API_USER["GET / PUT /api/cliente/perfil"]
        API_MASCOTAS["CRUD /api/cliente/mascotas"]
        API_CITAS["GET / POST / PUT /api/cliente/citas"]
        API_PAGOS["GET /api/cliente/pagos"]
    end

    P3 <--> API_AUTH
    P1 <--> API_USER
    SEC_PETS <--> API_MASCOTAS
    SEC_CITAS <--> API_CITAS
    SEC_PAGOS <--> API_PAGOS