flowchart TD
    %% Entrada
    ENTRY["/edeapro/index.html"] -->|Redirige| PUB_HOME["paginas/inicio.html"]

    %% Sitio Público
    subgraph Sitio_Publico ["Sitio Público (/edeapro/)"]
        PUB_HOME --> PUB_NOSOTROS["paginas/nosotros.html"]
        PUB_HOME --> PUB_SERV["paginas/servicios.html"]
        PUB_HOME --> PUB_AGENDA["paginas/agenda.html"]
        PUB_HOME --> PUB_UBICACION["paginas/ubicacion.html"]
        PUB_HOME --> PUB_LOGIN["paginas/login.html"]

        PUB_LOGIN -.-> PUB_RECOVER["paginas/nueva-contrasena.html"]

        %% Subpáginas Servicios
        PUB_SERV --> SERV_CORT["paginas/perrocorto.html"]
        PUB_SERV --> SERV_LARG["paginas/perrolargo.html"]
        PUB_SERV --> SERV_ESP["paginas/corteespecializado.html"]
        PUB_SERV --> SERV_GATOS["paginas/gatos.html"]
    end

    %% Autenticación y Redirecciones
    PUB_LOGIN -->|Autenticación Cliente| CLI_HOME["/edeapro/cliente/perfil.html"]
    PUB_LOGIN -->|Autenticación Admin| ADM_HOME["/edeapro/administrador/paginas/inicio.html"]
    PUB_LOGIN -->|Autenticación Empleado| EMP_HOME["/edeapro/empleado/paginas/inicio.html"]

    %% Área Cliente
    subgraph Modulo_Cliente ["Área Cliente (/edeapro/cliente/)"]
        CLI_HOME --- CLI_PERFIL["Perfil"]
        CLI_HOME --- CLI_MASCOTAS["Mascotas"]
        CLI_HOME --- CLI_CITAS["Citas (Reagendar/Cancelar)"]
        CLI_HOME --- CLI_PAGOS["Pagos"]
    end

    %% Área Administrador
    subgraph Modulo_Admin ["Área Administrador (/edeapro/administrador/paginas/)"]
        ADM_HOME --> ADM_CLI["clientes.html"]
        ADM_HOME --> ADM_EMP["empleados.html"]
        ADM_HOME --> ADM_SERV["servicios.html"]
        ADM_HOME --> ADM_HOR["horarios.html"]
        ADM_HOME --> ADM_NOT["notificaciones.html"]
        ADM_HOME --> ADM_PAG["pagos.html"]
        ADM_HOME --> ADM_REP["reportes.html"]
        ADM_HOME --> ADM_EST["estadisticas.html"]
    end

    %% Área Empleado
    subgraph Modulo_Empleado ["Área Empleado / Peluquero (/edeapro/empleado/paginas/)"]
        EMP_HOME --> EMP_CLI["clientes.html"]
        EMP_HOME --> EMP_DISP["disponibilidad.html"]
        EMP_HOME --> EMP_REP["reportes.html"]
    end

    %% Integración con Backend (API)
    subgraph Backend_API ["Laravel REST API (/api/)"]
        API_AUTH["/login | /registro | /logout"]
        API_PASS["/recuperar-contrasena | /restablecer-contrasena"]
        API_PUB["/citas/slots | /resenas | /estilistas"]
        API_CLI["/cliente/*"]
        API_ADM["/admin/* | /reportes/*"]
        API_EMP["/empleado/*"]
    end

    PUB_LOGIN <==> API_AUTH
    PUB_RECOVER <==> API_PASS
    PUB_AGENDA <==> API_PUB
    Modulo_Cliente <==> API_CLI
    Modulo_Admin <==> API_ADM
    Modulo_Empleado <==> API_EMP