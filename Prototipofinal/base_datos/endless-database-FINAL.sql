-- =====================================================
-- BASE DE DATOS DEFINITIVA - ENDLESS NIGHTMARE RITUAL
-- =====================================================
-- Este archivo contiene todo lo necesario para crear
-- la base de datos completa del juego desde cero.
-- =====================================================

DROP DATABASE IF EXISTS endless;
CREATE DATABASE endless;
USE endless;

-- =====================================================
-- TABLAS DE JUGADORES Y PROGRESO
-- =====================================================

CREATE TABLE Users (
    User_id INT AUTO_INCREMENT NOT NULL,
    Username VARCHAR(45) NOT NULL UNIQUE,
    Password_user VARCHAR(100) NOT NULL,
    Is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (User_id)
);

CREATE TABLE Player (
    Player_id INT AUTO_INCREMENT NOT NULL,
    Player_name VARCHAR(45) NOT NULL,
    Blood_current SMALLINT NOT NULL DEFAULT 100,
    Blood_max SMALLINT NOT NULL DEFAULT 100,
    School_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
    Hospital_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    Laboratory_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (Player_id)
);

CREATE TABLE Achievements (
    Achievements_id INT AUTO_INCREMENT NOT NULL,
    Achievements_name VARCHAR(50) NOT NULL,
    Achievements_description VARCHAR(100) NOT NULL,
    PRIMARY KEY (Achievements_id)
);

CREATE TABLE Player_Achievements (
    Player_id INT NOT NULL,
    Achievements_id INT NOT NULL,
    Date_unlocked DATE NOT NULL,
    PRIMARY KEY (Player_id, Achievements_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Achievements_id) REFERENCES Achievements(Achievements_id)
);

-- =====================================================
-- TABLAS DE NIVELES Y ENEMIGOS
-- =====================================================

CREATE TABLE Levels (
    Level_id INT AUTO_INCREMENT NOT NULL,
    Level_name VARCHAR(45) NOT NULL,
    Level_number SMALLINT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    PRIMARY KEY (Level_id)
);

CREATE TABLE Enemy (
    Enemy_id INT AUTO_INCREMENT NOT NULL,
    Level_id INT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    Blood_pool SMALLINT NOT NULL DEFAULT 50,
    Knockouts_to_win SMALLINT NOT NULL DEFAULT 6,
    PRIMARY KEY (Enemy_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

-- =====================================================
-- TABLAS DE CARTAS
-- =====================================================

CREATE TABLE Type_cards (
    Type_cards_id INT AUTO_INCREMENT NOT NULL,
    Type_cards_name VARCHAR(45) NOT NULL,
    Type_cards_description VARCHAR(100) NOT NULL,
    PRIMARY KEY (Type_cards_id)
);

CREATE TABLE Cards (
    Cards_id INT AUTO_INCREMENT NOT NULL,
    Cards_name VARCHAR(45) NOT NULL,
    Cards_cost SMALLINT NOT NULL,
    Type_cards_id INT NOT NULL,
    Cards_damage SMALLINT NULL,
    Cards_hp SMALLINT NULL,
    Cards_description VARCHAR(100) NOT NULL,
    PRIMARY KEY (Cards_id),
    FOREIGN KEY (Type_cards_id) REFERENCES Type_cards(Type_cards_id)
);

CREATE TABLE Player_Cards_Deck (
    Player_id INT NOT NULL,
    Cards_id INT NOT NULL,
    Quantity SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY (Player_id, Cards_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Cards_id) REFERENCES Cards(Cards_id)
);

-- =====================================================
-- TABLAS DE COMBATE
-- =====================================================

CREATE TABLE Combat (
    Combat_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Enemy_id INT NOT NULL,
    Combat_date DATETIME NOT NULL,
    Combat_result VARCHAR(20) NOT NULL,
    Turns_played SMALLINT NULL,
    Combat_duration INT NULL,
    PRIMARY KEY (Combat_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id)
);

CREATE TABLE Combat_Turns (
    Turn_id INT AUTO_INCREMENT NOT NULL,
    Combat_id INT NOT NULL,
    Turn_number SMALLINT NOT NULL,
    Active_player VARCHAR(20) NOT NULL,
    Blood_spent SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (Turn_id),
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id)
);

CREATE TABLE Combat_Cards_Actions (
    Action_id INT AUTO_INCREMENT NOT NULL,
    Combat_id INT NOT NULL,
    Turn_number SMALLINT NOT NULL,
    Card_id INT NOT NULL,
    Action_type VARCHAR(45) NOT NULL,
    Used_by VARCHAR(20) NOT NULL,
    Blood_spent SMALLINT NULL,
    Damage_dealt SMALLINT NULL,
    HP_before SMALLINT NULL,
    HP_after SMALLINT NULL,
    Card_dead BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (Action_id),
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Cards_id)
);

-- =====================================================
-- DATOS INICIALES - NIVELES
-- =====================================================

INSERT INTO Levels (Level_name, Level_number, Enemy_name) VALUES
('Escuela', 1, 'Arantza'),
('Hospital', 2, 'Monique'),
('Laboratorio', 3, 'Arantza y Monique');

-- =====================================================
-- DATOS INICIALES - ENEMIGOS
-- =====================================================

INSERT INTO Enemy (Level_id, Enemy_name, Blood_pool, Knockouts_to_win) VALUES
(1, 'Arantza', 50, 6),
(2, 'Monique', 80, 6),
(3, 'Arantza y Monique', 120, 6);

-- =====================================================
-- DATOS INICIALES - JUGADOR
-- =====================================================

INSERT INTO Users (Username, Password_user, Is_active) VALUES
('Basica', '123456', TRUE);

INSERT INTO Player (Player_name, Blood_current, Blood_max, School_unlocked, Hospital_unlocked, Laboratory_unlocked) VALUES
('Basica', 100, 100, TRUE, FALSE, FALSE);

-- =====================================================
-- DATOS INICIALES - TIPOS DE CARTAS
-- =====================================================

INSERT INTO Type_cards (Type_cards_name, Type_cards_description) VALUES
('Criatura', 'Carta que puede atacar y defender'),
('Hechizo', 'Carta de efecto inmediato'),
('Trampa', 'Carta que se activa en respuesta');

-- =====================================================
-- DATOS INICIALES - CARTAS DEL JUEGO
-- =====================================================

INSERT INTO Cards (Cards_name, Cards_cost, Type_cards_id, Cards_damage, Cards_hp, Cards_description) VALUES
-- Criaturas básicas (1-10)
('Criatura de las Sombras', 6, 1, 4, 4, 'Criatura básica oscura'),
('Espectro Menor', 5, 1, 3, 5, 'Fantasma débil pero resistente'),
('Zombi Errante', 7, 1, 5, 3, 'Muerto viviente agresivo'),
('Tragg', 11, 1, 7, 7, 'Criatura poderosa del abismo'),
('Emperador Jawa', 7, 1, 6, 5, 'Líder tribal místico'),
('Pesadilla Nocturna', 9, 1, 6, 6, 'Terror de la noche'),
('Epstein', 6, 1, 4, 5, 'Criatura manipuladora'),
('Gólem de Carne', 8, 1, 5, 7, 'Construcción viviente'),
('Arácnido Gigante', 6, 1, 5, 4, 'Araña de pesadilla'),
('Demonio Menor', 10, 1, 7, 6, 'Ser infernal'),

-- Hechizos (11-15)
('Drenar Vida', 4, 2, 3, NULL, 'Roba 3 de vida al enemigo'),
('Llamada Oscura', 6, 2, 5, NULL, 'Invoca poder oscuro'),
('Ritual de Sangre', 8, 2, 7, NULL, 'Sacrificio poderoso'),
('Maldición', 5, 2, 4, NULL, 'Debilita al enemigo'),
('Reanimación', 7, 2, NULL, NULL, 'Revive una criatura'),

-- Trampas (16-20)
('Espejo Oscuro', 5, 3, NULL, NULL, 'Refleja el próximo ataque'),
('Vacío Eterno', 6, 3, NULL, NULL, 'Destruye carta enemiga'),
('Sombra Defensora', 4, 3, NULL, NULL, 'Bloquea daño'),
('Contraataque', 7, 3, 5, NULL, 'Devuelve daño al atacante'),
('Trampa Mortal', 8, 3, 6, NULL, 'Daño masivo al enemigo');

-- =====================================================
-- DATOS INICIALES - MAZO DEL JUGADOR
-- =====================================================

INSERT INTO Player_Cards_Deck (Player_id, Cards_id, Quantity) VALUES
(1, 1, 3), (1, 2, 2), (1, 3, 2), (1, 4, 1),
(1, 5, 2), (1, 6, 1), (1, 7, 2), (1, 8, 2),
(1, 9, 2), (1, 10, 1), (1, 11, 2), (1, 12, 2),
(1, 13, 1), (1, 14, 2), (1, 15, 1), (1, 16, 2),
(1, 17, 1), (1, 18, 2), (1, 19, 1), (1, 20, 1);

-- =====================================================
-- DATOS INICIALES - LOGROS
-- =====================================================

INSERT INTO Achievements (Achievements_name, Achievements_description) VALUES
('Primer Combate', 'Gana tu primer combate'),
('Derrotó a Arantza', 'Derrota al enemigo de la Escuela'),
('Derrotó a Monique', 'Derrota al enemigo del Hospital'),
('Derrotó a Ambas', 'Derrota al jefe final del Laboratorio'),
('Superviviente', 'Completa un combate sin perder cartas'),
('Maestro del TCG', 'Completa todos los niveles');

-- =====================================================
-- FIN DE LA BASE DE DATOS
-- =====================================================

SELECT 'Base de datos ENDLESS creada exitosamente!' AS Status;
