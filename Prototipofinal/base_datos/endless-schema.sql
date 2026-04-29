DROP DATABASE IF EXISTS endless;
CREATE DATABASE endless;
USE endless;

-- =====================================================
-- USUARIOS Y JUGADOR
-- =====================================================

CREATE TABLE Users (
    User_id INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(45) NOT NULL UNIQUE,
    Password_user VARCHAR(100) NOT NULL,
    Is_active BOOLEAN NOT NULL DEFAULT TRUE,
    Created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_login TIMESTAMP NULL,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE Player (
    Player_id INT AUTO_INCREMENT PRIMARY KEY,
    User_id INT NOT NULL,
    Player_name VARCHAR(45) NOT NULL,
    Blood_current SMALLINT NOT NULL DEFAULT 100,
    Blood_max SMALLINT NOT NULL DEFAULT 100,
    Level SMALLINT NOT NULL DEFAULT 0,
    School_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
    Hospital_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    Laboratory_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    Secrets_discovered INT NOT NULL DEFAULT 0,
    Total_playtime INT NOT NULL DEFAULT 0,
    Achievements_unlocked INT NOT NULL DEFAULT 0,
    Created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player_user (User_id),
    FOREIGN KEY (User_id) REFERENCES Users(User_id) ON DELETE CASCADE
);

-- =====================================================
-- NIVELES, LABERINTOS Y ENEMIGOS
-- =====================================================

CREATE TABLE Levels (
    Level_id INT AUTO_INCREMENT PRIMARY KEY,
    Level_name VARCHAR(45) NOT NULL,
    Level_number SMALLINT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL
);

CREATE TABLE Labyrinth (
    Labyrinth_id INT AUTO_INCREMENT PRIMARY KEY,
    Level_id INT NOT NULL,
    Labyrinth_name VARCHAR(50) NOT NULL,
    Time_limit INT NOT NULL DEFAULT 60,
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Enemy (
    Enemy_id INT AUTO_INCREMENT PRIMARY KEY,
    Level_id INT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    Blood_pool SMALLINT NOT NULL DEFAULT 50,
    Knockouts_to_win SMALLINT NOT NULL DEFAULT 6,
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

-- =====================================================
-- CARTAS
-- =====================================================

CREATE TABLE Cards (
    Card_id INT AUTO_INCREMENT PRIMARY KEY,
    Card_name VARCHAR(45) NOT NULL,
    Blood_cost SMALLINT NOT NULL,
    Damage SMALLINT NULL,
    HP SMALLINT NULL,
    Sprite_path VARCHAR(255) NULL,
    Card_description VARCHAR(150) NOT NULL DEFAULT ''
);

-- =====================================================
-- RUNS Y PROGRESO TEMPORAL
-- =====================================================

CREATE TABLE Run (
    Run_id INT AUTO_INCREMENT PRIMARY KEY,
    Player_id INT NOT NULL,
    Labyrinth_id INT NOT NULL,
    Level_id INT NOT NULL,
    Completed BOOLEAN NULL,
    Blood_recovered INT NOT NULL DEFAULT 0,
    Cards_found INT NOT NULL DEFAULT 0,
    Secrets_found INT NOT NULL DEFAULT 0,
    Time_taken INT NOT NULL DEFAULT 0,
    Started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Completed_at DATETIME NULL,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Run_Checkpoints (
    Checkpoint_id INT AUTO_INCREMENT PRIMARY KEY,
    Run_id INT NOT NULL,
    Blood_current SMALLINT NOT NULL,
    Level_checkpoint SMALLINT NOT NULL,
    Created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE CASCADE
);

CREATE TABLE Run_Cards_Temp (
    Run_id INT NOT NULL,
    Card_id INT NOT NULL,
    Collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Run_id, Card_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

CREATE TABLE Deck (
    Deck_id INT AUTO_INCREMENT PRIMARY KEY,
    Player_id INT NOT NULL,
    Card_id INT NOT NULL,
    Run_id INT NULL,
    Card_gained BOOLEAN NOT NULL DEFAULT TRUE,
    Created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE SET NULL
);

CREATE TABLE Enemy_Cards (
    Enemy_id INT NOT NULL,
    Card_id INT NOT NULL,
    PRIMARY KEY (Enemy_id, Card_id),
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

-- =====================================================
-- SECRETOS, COFRES E ITEMS
-- =====================================================

CREATE TABLE Secrets (
    Secret_id INT AUTO_INCREMENT PRIMARY KEY,
    Secret_name VARCHAR(100) NOT NULL,
    Content TEXT NOT NULL
);

CREATE TABLE Player_Secrets (
    Player_id INT NOT NULL,
    Secret_id INT NOT NULL,
    Discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Player_id, Secret_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Secret_id) REFERENCES Secrets(Secret_id)
);

CREATE TABLE Chest (
    Chest_id INT AUTO_INCREMENT PRIMARY KEY,
    Labyrinth_id INT NOT NULL,
    Blood_amount INT NOT NULL DEFAULT 0,
    Secret_id INT NULL,
    Position_x SMALLINT NOT NULL DEFAULT 0,
    Position_y SMALLINT NOT NULL DEFAULT 0,
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id),
    FOREIGN KEY (Secret_id) REFERENCES Secrets(Secret_id)
);

CREATE TABLE Chest_card (
    Chest_id INT NOT NULL,
    Card_id INT NOT NULL,
    PRIMARY KEY (Chest_id, Card_id),
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

CREATE TABLE Player_Chest_Opened (
    Player_chest_id INT AUTO_INCREMENT PRIMARY KEY,
    Player_id INT NOT NULL,
    Chest_id INT NOT NULL,
    Run_id INT NULL,
    Opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_player_chest (Player_id, Chest_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE SET NULL
);

CREATE TABLE Player_Items (
    Player_item_id INT AUTO_INCREMENT PRIMARY KEY,
    Player_id INT NOT NULL,
    Item_name VARCHAR(50) NOT NULL,
    Obtained_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_player_item (Player_id, Item_name),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE
);

-- =====================================================
-- COMBATE
-- =====================================================

CREATE TABLE Combat (
    Combat_id INT AUTO_INCREMENT PRIMARY KEY,
    Player_id INT NOT NULL,
    Enemy_id INT NOT NULL,
    Run_id INT NULL,
    Level_id INT NULL,
    Result VARCHAR(20) NULL,
    Blood_used SMALLINT NOT NULL DEFAULT 0,
    Player_card_to_defeat SMALLINT NOT NULL DEFAULT 3,
    Enemy_card_to_defeat SMALLINT NOT NULL DEFAULT 3,
    Total_turns SMALLINT NOT NULL DEFAULT 0,
    Player_KO SMALLINT NOT NULL DEFAULT 0,
    Enemy_KO SMALLINT NOT NULL DEFAULT 0,
    Started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Ended_at DATETIME NULL,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE CASCADE,
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Combat_Turns (
    Turn_id INT AUTO_INCREMENT PRIMARY KEY,
    Combat_id INT NOT NULL,
    Turn_number SMALLINT NOT NULL,
    Active_player VARCHAR(20) NOT NULL,
    Blood_spent SMALLINT NOT NULL DEFAULT 0,
    Turn_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE
);

CREATE TABLE Combat_Cards_Actions (
    Action_id INT AUTO_INCREMENT PRIMARY KEY,
    Combat_id INT NOT NULL,
    Turn_id INT NULL,
    Turn_number SMALLINT NULL,
    Card_id INT NOT NULL,
    Action_type VARCHAR(45) NOT NULL,
    Used_by VARCHAR(20) NOT NULL,
    Blood_spent SMALLINT NULL,
    Damage_dealt SMALLINT NULL,
    HP_before SMALLINT NULL,
    HP_after SMALLINT NULL,
    Card_dead BOOLEAN NOT NULL DEFAULT FALSE,
    Created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE,
    FOREIGN KEY (Turn_id) REFERENCES Combat_Turns(Turn_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

CREATE TABLE Logs_combat (
    Log_combat_id INT AUTO_INCREMENT PRIMARY KEY,
    Combat_id INT NOT NULL,
    Enemy_id INT NOT NULL,
    Turn_id INT NOT NULL,
    Log_data TEXT NULL,
    Created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE,
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Turn_id) REFERENCES Combat_Turns(Turn_id) ON DELETE CASCADE
);

-- =====================================================
-- LOGROS
-- =====================================================

CREATE TABLE Achievements (
    Achievements_id INT AUTO_INCREMENT PRIMARY KEY,
    Achievements_name VARCHAR(50) NOT NULL,
    Achievements_description VARCHAR(150) NOT NULL
);

CREATE TABLE Player_Achievements (
    Player_id INT NOT NULL,
    Achievements_id INT NOT NULL,
    Date_unlocked DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (Player_id, Achievements_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Achievements_id) REFERENCES Achievements(Achievements_id)
);

-- =====================================================
-- DATOS INICIALES - NIVELES, LABERINTOS Y ENEMIGOS
-- =====================================================

INSERT INTO Levels (Level_id, Level_name, Level_number, Enemy_name) VALUES
(1, 'Escuela', 1, 'Arantza'),
(2, 'Laboratorio', 2, 'Monique'),
(3, 'Hospital', 3, 'Arantza y Monique');

INSERT INTO Labyrinth (Labyrinth_id, Level_id, Labyrinth_name, Time_limit) VALUES
(1, 1, 'Laberinto de la Escuela', 150),
(3, 3, 'Laberinto del Hospital', 120),
(4, 2, 'Laberinto del Laboratorio', 105);

INSERT INTO Enemy (Enemy_id, Level_id, Enemy_name, Blood_pool, Knockouts_to_win) VALUES
(1, 1, 'Arantza', 50, 6),
(2, 2, 'Monique', 80, 6),
(3, 3, 'Arantza y Monique', 120, 6);

-- =====================================================
-- DATOS INICIALES - CARTAS
-- =====================================================

INSERT INTO Cards (Card_id, Card_name, Blood_cost, Damage, HP, Sprite_path, Card_description) VALUES
(1,  'Acechador Carmesi', 4, 5, 10, '../assets/cards/1.png', 'Bestia comun del sendero rojo'),
(2,  'Espectro Nocturno', 5, 6, 11, '../assets/cards/espectro_nocturno.png', 'Aparicion fria de medianoche'),
(3,  'Grave Whisper', 5, 5, 10, '../assets/cards/Grave_whisperer.png', 'Susurra desde la fosa'),
(4,  'Sombra Voraz', 4, 5, 10, '../assets/cards/sombra_voraz.png', 'Consume todo a su paso'),
(5,  'Latigo Umbral', 5, 6, 10, '../assets/cards/latigo_umbral.png', 'Golpea desde la penumbra'),
(6,  'Criatura de la Niebla', 6, 6, 11, '../assets/cards/criatura_niebla.png', 'Surge entre vapores corruptos'),
(7,  'Pesadilla', 6, 6, 11, '../assets/cards/pesadilla.png', 'Encarnacion del terror'),
(8,  'Engendro Oscuro', 6, 7, 12, '../assets/cards/e_oscuro.png', 'Ser nacido del abismo'),
(9,  'Epstein', 13, 13, 9, '../assets/cards/epstein.png', 'Entidad manipuladora de elite'),
(10, 'Devorador de Almas', 7, 7, 13, '../assets/cards/devorador_almas.png', 'Arranca la esencia vital'),
(11, 'Vinicius Junior', 7, 8, 13, '../assets/cards/viniJR.png', 'Rapidez brutal en el campo'),
(12, 'Emperador Julian', 7, 7, 14, '../assets/cards/EmperadorJB.png', 'Soberano de la oscuridad'),
(13, 'Sacerdotisa Carmesi', 7, 7, 14, '../assets/cards/sarcedostista.png', 'Canaliza ritos sangrientos'),
(14, 'Blood Stalker', 8, 9, 14, '../assets/cards/Blood_stalker.png', 'Persigue el rastro de sangre'),
(15, 'TZA la Bruja', 8, 8, 14, '../assets/cards/TZA_bruja.png', 'Hechicera del pantano rojo'),
(16, 'Golem de Huesos', 8, 9, 15, '../assets/cards/golem_huesos.png', 'Coloso ensamblado con restos'),
(17, 'Caballero de la Plaga', 8, 8, 15, '../assets/cards/caballero_plaga.png', 'Portador de pestilencia'),
(18, 'Grumpy Daniel', 8, 10, 12, '../assets/cards/grumpy_daniel.png', 'Golpea malhumorado y sin aviso'),
(19, 'Hechicero Maldito', 9, 9, 16, '../assets/cards/hechicero_maldito.png', 'Brujo consumido por su pacto'),
(20, 'Caballero de Sangre', 9, 9, 16, '../assets/cards/caballer_sangre.png', 'Guerrero alimentado por sacrificios'),
(21, 'El Rey Julen', 9, 10, 16, '../assets/cards/ReyJB.png', 'Monarca de la corona roja'),
(22, 'Saka el Fantasma', 9, 9, 16, '../assets/cards/saka.png', 'Ataca y se desvanece'),
(23, 'Senor de la Cripta', 9, 9, 17, '../assets/cards/senor_cripta.png', 'Custodio de tumbas eternas'),
(24, 'Simmon el Tenebroso', 10, 10, 18, '../assets/cards/simmon.png', 'Guerrero sombrio veterano'),
(25, 'Guardian Colosal', 10, 10, 18, '../assets/cards/guardain_colosal.png', 'Vigila el portal del rito'),
(26, 'Bestia del Abismo', 10, 10, 18, '../assets/cards/bestia_del_Abismo.png', 'Depredador del vacio'),
(27, 'Sauron', 10, 10, 18, '../assets/cards/sauron.png', 'Ojo de fuego y dominio'),
(28, 'El Lich', 10, 10, 18, '../assets/cards/lich.png', 'Nigromante del final'),
(29, 'La Panza Pandi', 10, 11, 18, '../assets/cards/pandi.png', 'Masa bruta impredecible'),
(30, 'Tragg', 11, 11, 20, '../assets/cards/tragg.png', 'Titan del abismo'),
(31, 'Simmon Ascendido', 11, 12, 20, '../assets/cards/simmon_epico.png', 'Version epica del tenebroso'),
(32, 'Mbappe el Dictador', 11, 12, 21, '../assets/cards/mbappe.png', 'Implacable y explosivo'),
(33, 'Leviatan', 12, 13, 22, '../assets/cards/leviatan.png', 'Coloso del mar oscuro'),
(34, 'JB', 12, 12, 22, '../assets/cards/JBcard.png', 'Avatar oscuro del ritual'),
(35, 'JB el Inmortal', 14, 14, 28, '../assets/cards/JBinmortal.png', 'Forma suprema indestructible'),
(36, 'Pablo', 8, 9, 14, '../assets/cards/pablo.png', 'Carta invitada del caos');

-- =====================================================
-- DATOS INICIALES - MAZOS DE ENEMIGOS
-- =====================================================

INSERT INTO Enemy_Cards (Enemy_id, Card_id) VALUES
(1, 1), (1, 2), (1, 7), (1, 9), (1, 11), (1, 14), (1, 16), (1, 18),
(1, 21), (1, 22),
(2, 3), (2, 5), (2, 6), (2, 8), (2, 12), (2, 15), (2, 17), (2, 19),
(2, 29), (2, 30), (2, 31),
(3, 4), (3, 6), (3, 8), (3, 10), (3, 13), (3, 15), (3, 19), (3, 20),
(3, 32), (3, 33), (3, 34), (3, 35), (3, 36);

-- =====================================================
-- DATOS INICIALES - SECRETOS
-- =====================================================

INSERT INTO Secrets (Secret_id, Secret_name, Content) VALUES
(1, 'El Primer Ritual', 'Todo comenzo con un experimento fallido en el sotano del hospital...'),
(2, 'Verdad Oculta', 'Los doctores sabian lo que hacian. Todos lo sabian.'),
(3, 'La Puerta Sellada', 'Nadie recuerda quien cerro la puerta. Solo saben que nunca debe abrirse.'),
(4, 'Sangre en las Paredes', 'Las manchas no son pintura. Nunca lo fueron.'),
(5, 'El Nino Perdido', 'Dicen que sigue vagando por los pasillos, buscando su nombre.'),
(6, 'La Primera Victima', 'Su expediente fue borrado. Su historia, no.'),
(7, 'Sombra sin Dueno', 'La sombra en el pasillo no corresponde a nadie presente.'),
(8, 'El Reloj Detenido', 'Todas las agujas apuntan a las 3:17. Nadie sabe por que.'),
(9, 'Escritura en el Suelo', 'Las palabras estan grabadas con algo mas duro que un clavo.'),
(10, 'El Espejo Roto', 'Cada fragmento refleja una cara diferente. Ninguna es la tuya.'),
(11, 'Voz en el Sotano', 'La grabacion muestra una voz que nadie recuerda haber dejado.'),
(12, 'El Pasillo Infinito', 'Cuentan los pasos. Siempre son mas de los que deberian.'),
(13, 'El Salon Prohibido', 'El aula 13 fue clausurada despues del incidente de 1987.'),
(14, 'La Lista de Nombres', 'Todos los nombres en la lista desaparecieron el mismo ano.'),
(15, 'Diario de un Alumno', 'Las ultimas paginas estan arrancadas. Las anteriores, manchadas.'),
(16, 'El Trofeo Extrano', 'El trofeo lleva una fecha que aun no ha llegado.'),
(17, 'Foto de Graduacion', 'En la foto hay una figura que no estaba en la ceremonia.'),
(18, 'La Campana', 'Suena cada noche a medianoche. El edificio lleva anos abandonado.'),
(19, 'Mapa del Sotano', 'El mapa muestra habitaciones que no aparecen en los planos oficiales.'),
(20, 'El Maestro Olvidado', 'Su nombre fue eliminado de todos los registros en una sola noche.'),
(21, 'Cuaderno sin Dueno', 'Cada pagina contiene el mismo nombre escrito cientos de veces.'),
(22, 'Expediente 001', 'El primer paciente nunca fue dado de alta. Tampoco fue registrado como fallecido.'),
(23, 'La Sala de Operaciones', 'La sala 7 fue sellada tras una operacion que ningun medico recuerda haber realizado.'),
(24, 'Receta Prohibida', 'El medicamento en la receta no existe en ningun catalogo farmaceutico.'),
(25, 'El Turno de Noche', 'Tres enfermeras reportaron ver lo mismo. Las tres renunciaron al dia siguiente.'),
(26, 'Historial Borrado', 'El sistema elimino el historial solo. Los logs no muestran ningun usuario activo.'),
(27, 'La Ambulancia', 'Llego sin llamarla. Se fue sin llevarse a nadie visible.'),
(28, 'Sangre Tipo X', 'El tipo de sangre en las muestras no coincide con ninguno conocido.'),
(29, 'El Paciente 0', 'Su nombre solo aparece en un documento. El documento esta fechado en el futuro.'),
(30, 'Radiografia Anomala', 'La imagen muestra una estructura dentro del cuerpo que no tiene nombre.'),
(31, 'La Ultima Llamada', 'La llamada de emergencia dura 3 minutos. No hay voz. Solo respiracion.'),
(32, 'Formula Incompleta', 'Los ultimos pasos del experimento fueron arrancados del cuaderno.'),
(33, 'Muestra Viva', 'La muestra en el frasco sigue moviendose. El experimento termino hace 20 anos.'),
(34, 'El Cientifico', 'Sus notas describen algo que no deberia ser posible. Sus notas tienen razon.'),
(35, 'Protocolo Omega', 'El protocolo nunca fue aprobado. Aun asi, fue ejecutado.'),
(36, 'Registro de Errores', 'El sistema registro 9999 errores criticos. El maximo posible es 9998.'),
(37, 'La Criatura', 'El expediente describe su apariencia con todo detalle. La descripcion cambia cada vez que se lee.'),
(38, 'Energia Desconocida', 'Los sensores detectaron una frecuencia que no deberia existir en la naturaleza.'),
(39, 'El Ultimo Informe', 'Fue enviado a las 4:44 AM. El edificio estaba vacio desde medianoche.'),
(40, 'El Origen', 'Todo comenzo aqui. Todo terminara aqui.');

-- =====================================================
-- DATOS INICIALES - COFRES
-- =====================================================

INSERT INTO Chest (Chest_id, Labyrinth_id, Blood_amount, Secret_id, Position_x, Position_y) VALUES
(1, 1, 10, 1, 5, 5),
(2, 1, 15, 2, 10, 3),
(3, 1, 20, 3, 2, 8),
(4, 1, 5, 4, 7, 7),
(5, 1, 12, 5, 6, 4),
(6, 1, 8, 6, 3, 9),
(7, 1, 14, 7, 11, 1),
(8, 1, 9, 8, 8, 6),
(9, 1, 11, 9, 4, 10),
(10, 1, 7, 10, 12, 2),
(11, 1, 10, 11, 5, 5),
(12, 1, 15, 12, 10, 3),
(13, 1, 20, 13, 2, 8),
(14, 1, 5, 14, 7, 7),
(15, 1, 12, 15, 6, 4),
(16, 1, 8, 16, 3, 9),
(17, 1, 14, 17, 11, 1),
(18, 1, 9, 18, 8, 6),
(19, 1, 11, 19, 4, 10),
(20, 1, 7, 20, 12, 2),
(21, 3, 10, 21, 5, 5),
(22, 3, 15, 22, 10, 3),
(23, 3, 20, 23, 2, 8),
(24, 3, 5, 24, 7, 7),
(25, 3, 12, 25, 6, 4),
(26, 3, 8, 26, 3, 9),
(27, 3, 14, 27, 11, 1),
(28, 3, 9, 28, 8, 6),
(29, 3, 11, 29, 4, 10),
(30, 3, 7, 30, 12, 2),
(31, 4, 10, 31, 5, 5),
(32, 4, 15, 32, 10, 3),
(33, 4, 20, 33, 2, 8),
(34, 4, 5, 34, 7, 7),
(35, 4, 12, 35, 6, 4),
(36, 4, 8, 36, 3, 9),
(37, 4, 14, 37, 11, 1),
(38, 4, 9, 38, 8, 6),
(39, 4, 11, 39, 4, 10),
(40, 4, 7, 40, 12, 2);

INSERT INTO Chest_card (Chest_id, Card_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16), (17, 17), (18, 18), (19, 19), (20, 20),
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25), (26, 26), (27, 27), (28, 28), (29, 29), (30, 30),
(31, 31), (32, 32), (33, 33), (34, 34), (35, 35), (36, 36), (37, 1), (38, 2), (39, 3), (40, 4);

-- =====================================================
-- DATOS INICIALES - LOGROS
-- =====================================================

INSERT INTO Achievements (Achievements_name, Achievements_description) VALUES
('Primer Combate', 'Gana tu primer combate'),
('Derroto a Arantza', 'Derrota al enemigo de la Escuela'),
('Derroto a Monique', 'Derrota al enemigo del Hospital'),
('Derroto a Ambas', 'Derrota al jefe final del Laboratorio'),
('Superviviente', 'Completa un combate sin perder cartas'),
('Maestro del TCG', 'Completa todos los niveles');

-- =====================================================
-- USUARIOS BASE DE PRUEBA
-- =====================================================

INSERT INTO Users (User_id, Username, Password_user, Is_active) VALUES
(1, 'Juan', 'JCLuzudemy', TRUE),
(2, 'Julian', '12345', TRUE),
(3, 'monikkkkk', '1234', TRUE),
(4, 'arantzamonique', '1234', TRUE),
(5, 'Juan Carlos', 'night', TRUE),
(6, 'Esteban', 'mysql', TRUE),
(7, 'Gilberto', 'delta', TRUE),
(8, 'Angel', 'html', TRUE);

INSERT INTO Player (Player_id, User_id, Player_name) VALUES
(1, 1, 'Juan'),
(2, 2, 'Julian'),
(3, 3, 'monikkkkk'),
(4, 4, 'arantzamonique'),
(5, 5, 'Juan Carlos'),
(6, 6, 'Esteban'),
(7, 7, 'Gilberto'),
(8, 8, 'Angel');

INSERT INTO Deck (Player_id, Card_id, Card_gained) VALUES
(1, 1, TRUE), (1, 2, TRUE), (1, 7, TRUE), (1, 9, TRUE), (1, 11, TRUE),
(2, 1, TRUE), (2, 2, TRUE), (2, 7, TRUE), (2, 9, TRUE), (2, 11, TRUE),
(3, 1, TRUE), (3, 2, TRUE), (3, 7, TRUE), (3, 9, TRUE), (3, 11, TRUE),
(4, 1, TRUE), (4, 2, TRUE), (4, 7, TRUE), (4, 9, TRUE), (4, 11, TRUE),
(5, 1, TRUE), (5, 2, TRUE), (5, 7, TRUE), (5, 9, TRUE), (5, 11, TRUE),
(6, 1, TRUE), (6, 2, TRUE), (6, 7, TRUE), (6, 9, TRUE), (6, 11, TRUE),
(7, 1, TRUE), (7, 2, TRUE), (7, 7, TRUE), (7, 9, TRUE), (7, 11, TRUE),
(8, 1, TRUE), (8, 2, TRUE), (8, 7, TRUE), (8, 9, TRUE), (8, 11, TRUE);

-- =====================================================
-- TRIGGERS DE COMPATIBILIDAD
-- =====================================================

DELIMITER $$

CREATE TRIGGER trg_update_last_login
AFTER INSERT ON Player
FOR EACH ROW
BEGIN
    UPDATE Users
    SET Last_login = CURRENT_TIMESTAMP
    WHERE User_id = NEW.User_id;
END$$

CREATE TRIGGER trg_validate_player_blood
BEFORE UPDATE ON Player
FOR EACH ROW
BEGIN
    IF NEW.Blood_current > NEW.Blood_max THEN
        SET NEW.Blood_current = NEW.Blood_max;
    END IF;

    IF NEW.Blood_current < 0 THEN
        SET NEW.Blood_current = 0;
    END IF;
END$$

CREATE TRIGGER trg_update_playtime
AFTER UPDATE ON Combat
FOR EACH ROW
BEGIN
    DECLARE combat_duration INT;

    IF NEW.Ended_at IS NOT NULL AND OLD.Ended_at IS NULL THEN
        SET combat_duration = TIMESTAMPDIFF(SECOND, NEW.Started_at, NEW.Ended_at);

        UPDATE Player
        SET Total_playtime = Total_playtime + combat_duration
        WHERE Player_id = NEW.Player_id;
    END IF;
END$$

DELIMITER ;

SELECT 'Base de datos ENDLESS unificada creada correctamente.' AS Status;
