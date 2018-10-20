DROP TABLE CNBS_DEV.dbo.Departamento;
DROP TABLE CNBS_DEV.dbo.Evidencia;
DROP TABLE CNBS_DEV.dbo.Practica;
DROP TABLE CNBS_DEV.dbo.Elemento;
DROP TABLE CNBS_DEV.dbo.Componente;
DROP TABLE CNBS_DEV.dbo.Actividad;
DROP TABLE CNBS_DEV.dbo.Actividad_FechasFinales;
DROP TABLE CNBS_DEV.dbo.Token;

CREATE TABLE CNBS_DEV.dbo.UnidadMedida (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Nombre varchar(50)
);

CREATE TABLE CNBS_DEV.dbo.Producto (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Nombre varchar(50)
);

CREATE TABLE CNBS_DEV.dbo.Departamento (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Nombre varchar(50),
    CorreoJefe varchar(50),
    Departamento varchar(1)
);

CREATE TABLE CNBS_DEV.dbo.Practica (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(1000),
    Nombre varchar(20),
    FechaInicio date,
    FechaFinal date,
    Responsable varchar(50),
    Elemento int,
    Departamento int,
    PorcentajeCompletado decimal,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.Elemento (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(150),
    Nombre varchar(20),
    Componente int,
    Departamento int,
    PorcentajeCompletado decimal,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.Componente (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(150),
    Nombre varchar(20),
    Departamento int,
    PorcentajeCompletado decimal,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.Actividad (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(300),
    Nombre varchar(20),
    FechaInicio date,
    Responsable varchar(50),
    CorreoResponsable varchar(50),
    Practica int,
    Departamento int,
    UnidadMedida int,
    Indicador int,
    AreaMejora int,
    Producto int,
    PorcentajeCompletado decimal,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.Actividad_FechasFinales (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Actividad int,
    FechaFinal date,
    PorcentajeCompletadoPlaneacion int,
    PorcentajeCompletadoEjecucion int,
    Anio int,
    Comentario varchar(150)
);

CREATE TABLE CNBS_DEV.dbo.Usuario (
    Nombre varchar(50),
    Apellido varchar(50),
    Cargo varchar(50),
    Departamento varchar(50),
    Rol varchar(50),
    Password varchar(512),
    Correo varchar(50) PRIMARY KEY
);

CREATE TABLE CNBS_DEV.dbo.Token (
    Correo varchar(50),
    Access varchar(50),
    Token nvarchar(512)
);