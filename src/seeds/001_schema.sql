DROP TABLE IF EXISTS mensajes_intercambio CASCADE;
DROP TABLE IF EXISTS intercambio_laminas CASCADE;
DROP TABLE IF EXISTS intercambios CASCADE;
DROP TABLE IF EXISTS coleccion_usuario CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS laminas_panini_2026 CASCADE;
DROP TABLE IF EXISTS paises_mundial_2026 CASCADE;

CREATE TABLE paises_mundial_2026 (
    iso3 VARCHAR(3) PRIMARY KEY,
    pais VARCHAR(100) NOT NULL,
    grupo CHAR(1) NOT NULL
);

CREATE TABLE laminas_panini_2026 (
    id VARCHAR(10) NOT NULL PRIMARY KEY,
    nombre_sticker VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    estatura_cm INT,
    peso_kg INT,
    equipo_actual VARCHAR(100),
    es_especial BOOLEAN DEFAULT FALSE,
    foto_url VARCHAR(255),
    iso3 VARCHAR(3),
    posicion VARCHAR(15),
    CONSTRAINT laminas_panini_2026_FK1 FOREIGN KEY (iso3) REFERENCES paises_mundial_2026(iso3)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255),
    pais VARCHAR(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coleccion_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    lamina_id VARCHAR(10) NOT NULL REFERENCES laminas_panini_2026(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'coleccion' CHECK (estado IN ('coleccion', 'intercambiable')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE intercambios (
    id SERIAL PRIMARY KEY,
    usuario_ofrece INT NOT NULL REFERENCES usuarios(id),
    usuario_recibe INT NOT NULL REFERENCES usuarios(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptado', 'rechazado', 'completado')),
    tipo VARCHAR(20) NOT NULL DEFAULT 'virtual' CHECK (tipo IN ('presencial', 'virtual')),
    punto_encuentro VARCHAR(255),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completado TIMESTAMP
);

CREATE TABLE intercambio_laminas (
    id SERIAL PRIMARY KEY,
    intercambio_id INT NOT NULL REFERENCES intercambios(id) ON DELETE CASCADE,
    lamina_id VARCHAR(10) NOT NULL REFERENCES laminas_panini_2026(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ofrece', 'recibe'))
);

CREATE TABLE mensajes_intercambio (
    id SERIAL PRIMARY KEY,
    intercambio_id INT NOT NULL REFERENCES intercambios(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO paises_mundial_2026 (iso3, pais, grupo) VALUES
('MEX', 'Mexico', 'A'), ('RSA', 'South Africa', 'A'), ('KOR', 'South Korea', 'A'), ('CZE', 'Czech Republic', 'A'),
('CAN', 'Canada', 'B'), ('BIH', 'Bosnia and Herzegovina', 'B'), ('QAT', 'Qatar', 'B'), ('SUI', 'Switzerland', 'B'),
('BRA', 'Brazil', 'C'), ('MAR', 'Morocco', 'C'), ('HAI', 'Haiti', 'C'), ('SCO', 'Scotland', 'C'),
('USA', 'United States', 'D'), ('PAR', 'Paraguay', 'D'), ('AUS', 'Australia', 'D'), ('TUR', 'Turkey', 'D'),
('GER', 'Germany', 'E'), ('CUW', 'Curacao', 'E'), ('CIV', 'Ivory Coast', 'E'), ('ECU', 'Ecuador', 'E'),
('NED', 'Netherlands', 'F'), ('JPN', 'Japan', 'F'), ('SWE', 'Sweden', 'F'), ('TUN', 'Tunisia', 'F'),
('BEL', 'Belgium', 'G'), ('EGY', 'Egypt', 'G'), ('IRN', 'Iran', 'G'), ('NZL', 'New Zealand', 'G'),
('ESP', 'Spain', 'H'), ('CPV', 'Cape Verde', 'H'), ('KSA', 'Saudi Arabia', 'H'), ('URU', 'Uruguay', 'H'),
('FRA', 'France', 'I'), ('SEN', 'Senegal', 'I'), ('IRQ', 'Iraq', 'I'), ('NOR', 'Norway', 'I'),
('ARG', 'Argentina', 'J'), ('ALG', 'Algeria', 'J'), ('AUT', 'Austria', 'J'), ('JOR', 'Jordan', 'J'),
('POR', 'Portugal', 'K'), ('COD', 'DR Congo', 'K'), ('UZB', 'Uzbekistan', 'K'), ('COL', 'Colombia', 'K'),
('ENG', 'England', 'L'), ('CRO', 'Croatia', 'L'), ('GHA', 'Ghana', 'L'), ('PAN', 'Panama', 'L');
