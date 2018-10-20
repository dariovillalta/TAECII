CREATE TABLE CNBS_DEV.dbo.Departamento (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Nombre varchar(50),
    CorreoJefe varchar(50),
    Departamento varchar(1)
);

CREATE TABLE CNBS_DEV.dbo.Evidencia (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Nombre varchar(50)
);

CREATE TABLE CNBS_DEV.dbo.ActividadPlaneacion (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(300),
    Nombre varchar(20),
    FechaInicio date,
    Responsable varchar(50),
    Departamento int,
    Evidencia varchar(80),
    Producto varchar(80),
    PorcentajeCompletado decimal,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.ActividadEjecucion (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Descripcion varchar(300),
    Nombre varchar(20),
    FechaInicio date,
    Responsable varchar(50),
    Practica int,
    Departamento int,
    Evidencia varchar(80),
    Producto varchar(80),
    PorcentajeCompletado decimal,
    Anio int
);
----Preguntar fecha final de actividades (si tienen), 

--Agregar campo de etapa, si es planificacion o ejecucion
--El cumplimiento semaforo se cLCULA EN BASE A Lo que se planifico y al final en lo que se ejecuto

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

CREATE TABLE CNBS_DEV.dbo.ActividadPlaneacion_FechasFinales (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Actividad int,
    FechaFinal date,
    PorcentajeCompletadoPlaneacion int,
    PorcentajeCompletadoEjecucion int,
    Anio int
);

CREATE TABLE CNBS_DEV.dbo.ActividadEjecucion_FechasFinales (
    ID int IDENTITY(1,1) PRIMARY KEY,
    Actividad int,
    FechaFinal date,
    PorcentajeCompletado int,
    Anio int
);


--
----
------Utilizar estas tablas de actividades
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
    Anio int
);

SELECT * FROM CNBS_DEV.dbo.Elemento;

SELECT * FROM CNBS_DB_Dev.dbo.Practica WHERE 'ID' = 'null';

CREATE DATABASE CNBS_DEV;
--DROP TABLE CNBS_DEV.dbo.Actividad_FechasFinales;

INSERT INTO CNBS_DEV.dbo.Usuario VALUES ('Dario', 'Villalta', 'Admin', 'Informatica', 'Supervisor', '12345', 'dario.villalta@gmail.com');
INSERT INTO CNBS_DEV.dbo.Usuario VALUES ('David', 'Villalta', 'Admin', 'Informatica', 'Jefe', '12345', 'david.villalta@gmail.com');
INSERT INTO CNBS_DEV.dbo.Usuario VALUES ('Diego', 'Villalta', 'Admin', 'Informatica', 'Contraparte', '12345', 'diego.villalta@gmail.com');

INSERT INTO CNBS_DEV.dbo.Componente VALUES ('Ambiente de Control', '1', 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Componente VALUES ('Evaluación y Gestion de Riesgos', '2', 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Componente VALUES ('Actividades de Control', '3', 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Elemento VALUES ('Compromiso con el Control Interno y Adhesión a las Políticas', '1.1', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Elemento VALUES ('Compromiso con el Control Externo y Adhesión a las Políticas', '1.2', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Elemento VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam', '1.3', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Elemento VALUES ('Otro Elemento', '2.1', 2, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Elemento VALUES ('Elemento Anexo', '3.1', 3, 1, 0, 2017);

INSERT INTO CNBS_DEV.dbo.Practica VALUES ('Practica con Compromiso', '1.1.1', '2008-11-11', '2008-11-05', 'Dario', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Practica VALUES ('Practica con Compromiso', '1.1.2', '2008-11-11', '2008-11-05', 'Dario', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Practica VALUES ('Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.', '1.1.3', '2018-12-11', '2018-11-10', 'Dario', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Practica VALUES ('Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.', '1.1.4', '2018-10-11', '2018-11-05', 'Dario', 1, 1, 0, 2017);
INSERT INTO CNBS_DEV.dbo.Actividad VALUES ('Actividad con Compromiso', '1.1.1.1', '2008-11-11', 'Dario', 'dario.villalta@gmail.com', 1, 1, 0, 0, 'Hojas', 0, 2017);
INSERT INTO CNBS_DEV.dbo.Actividad VALUES ('Actividad con Compromiso 2', '1.1.2.1', '2008-11-11', 'Dario', 'dario.villalta@gmail.com', 2, 1, 0, 0, 'Hojas', 0, 2017);
INSERT INTO CNBS_DEV.dbo.Actividad VALUES ('Actividad con Compromiso 2.2', '1.1.2.2', '2018-11-11', 'Dario', 'dario.villalta@gmail.com', 2, 1, 0, 0, 'Hojas', 0, 2017);
INSERT INTO CNBS_DEV.dbo.Actividad_FechasFinales VALUES (1, '2008-11-11', 1, 1 ,2017);
INSERT INTO CNBS_DEV.dbo.Actividad_FechasFinales VALUES (1, '2009-12-12', 100, 100 ,2017);
INSERT INTO CNBS_DEV.dbo.Actividad_FechasFinales VALUES (2, '2008-11-11', 1, 1 ,2017);

INSERT INTO CNBS_DEV.dbo.Evidencia VALUES ('Documentos');
INSERT INTO CNBS_DEV.dbo.Evidencia VALUES ('Fotos');
INSERT INTO CNBS_DEV.dbo.Evidencia VALUES ('Libros');
INSERT INTO CNBS_DEV.dbo.Evidencia VALUES ('Folletos');
--INSERT INTO CNBS_DB_Dev.dbo.Actividad_FechasFinales VALUES (1, 1, null, false ,2017);