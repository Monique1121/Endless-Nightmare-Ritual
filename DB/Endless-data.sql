-- data endless

INSERT INTO Users (Username, Password_hash)
VALUES
('Julian','hash1'),
('Juan Carlos','hash2'),
('Arantza','hash3'),
('user4','hash4'),
('user5','hash5'),
('user6','hash6'),
('user7','hash7'),
('user8','hash8'),
('user9','hash9'),
('user10','hash10'),
('user11','hash11'),
('user12','hash12'),
('user13','hash13'),
('user14','hash14'),
('user15','hash15'),
('user16','hash16'),
('user17','hash17'),
('user18','hash18'),
('user19','hash19'),
('user20','hash20'),
('user21','hash21'),
('user22','hash22'),
('user23','hash23'),
('user24','hash24'),
('user25','hash25'),
('user26','hash26'),
('user27','hash27'),
('user28','hash28'),
('user29','hash29'),
('user30','hash30');

INSERT INTO Player (
    User_id,
    Player_name,
    Blood_max,
    Blood_current,
    Level,
    School_unlocked,
    Hospital_unlocked,
    Laboratory_unlocked,
    Secrets_discovered,
    Total_playtime,
    Achievements_unlocked)


VALUES
(1,'Player1',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(2,'Player2',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(3,'Player3',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(4,'Player4',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(5,'Player5',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(6,'Player6',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(7,'Player7',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(8,'Player8',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(9,'Player9',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(10,'Player10',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(11,'Player11',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(12,'Player12',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(13,'Player13',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(14,'Player14',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(15,'Player15',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(16,'Player16',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(17,'Player17',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(18,'Player18',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(19,'Player19',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(20,'Player20',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(21,'Player21',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(22,'Player22',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(23,'Player23',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(24,'Player24',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(25,'Player25',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(26,'Player26',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(27,'Player27',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(28,'Player28',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(29,'Player29',100,100,0,TRUE,FALSE,FALSE,0,0,0),
(30,'Player30',100,100,0,TRUE,FALSE,FALSE,0,0,0);

INSERT INTO Cards (
    Card_name,
    Blood_cost,
    Damage,
    HP,
    Sprite_path
)
VALUES
('Acechador Carmesí', 5, 7, 12, 'assets/cards/achador.png'), -- id 1
('Bestia del Abismo', 20, 22, 35, 'assets/cards/bestia_del_Abismo.png'), -- id 2
('Blood Stalker', 10, 25, 15, 'assets/cards/Blood_stalker.png'), -- id 3
('Caballero de Sangre', 12, 16, 35, 'assets/cards/caballer_sangre.png'), -- id 4
('Caballero de la Plaga', 12, 16, 30, 'assets/cards/caballero_plaga.png'),  -- id 5
('Emperador Julian', 10, 14, 32, 'assets/cards/EmperadorJB.png'), -- id 6
('Epstien', 13, 13, 9, 'assets/cards/epstein.png'), -- id 7
('Espectro Nocturno', 6, 9, 18, 'assets/cards/espectro_nocturno.png'), -- id 8
('Grave Whisper', 3, 6, 14, 'assets/cards/Grave_whisperer.png'), -- id 9
('Guardián Colosal', 14, 14, 30, 'assets/cards/guardain_colosal.png'), -- id 10
('JB', 25, 45, 25, 'assets/cards/JBcard.png'), -- id 11
('Pesadilla', 8, 6, 12, 'assets/cards/pesadilla.png'), -- id 12
('El Rey Julen', 11, 24, 25, 'assets/cards/ReyJB.png'), -- id 13
('Sacerdotisa Carmesí', 10, 12, 22, 'assets/cards/sarcedostista.png'), -- id 14
('Sauron', 15, 12, 18, 'assets/cards/sauron.png'), -- id 15
('Señor de la Cripta', 12, 14, 24, 'assets/cards/senor_cripta.png'), -- id 16
('Simmon el Tenebroso', 17, 17, 12, 'assets/cards/simmon.png'), -- id 17
('TZA la bruja', 12, 12, 16, 'assets/cards/TZA_bruja.png'); -- id 18


INSERT INTO Levels (Level_name, Level_number, Enemy_name) VALUES
('Tutorial', 0, 'Arantza 1'), -- id 1 
('Escuela', 1, 'Monique'), -- id 2
('Hospital', 2, 'Monique enojada '), -- id 3
('Laboratorio', 3, 'Arantza Monique'); -- id 4

INSERT INTO Labyrinth (Level_id, time_limit ) VALUES
(1, 420),
(2, 240),
(3, 90),
(4, 60);

INSERT INTO Run (
    Player_id,
    Labyrinth_id,
    Level_id,
    Completed,
    Time_taken
)
VALUES
(1,1,1,TRUE,100),
(2,1,1,FALSE,110),
(3,2,2,TRUE,95),
(4,2,2,FALSE,80),
(5,3,3,TRUE,55),
(6,3,3,FALSE,60),
(7,4,4,TRUE,45),
(8,4,4,FALSE,50),
(9,1,1,TRUE,90),
(10,1,1,FALSE,120),
(11,2,2,TRUE,85),
(12,2,2,FALSE,100),
(13,3,3,TRUE,50),
(14,3,3,FALSE,70),
(15,4,4,TRUE,40),
(16,4,4,FALSE,55),
(17,1,1,TRUE,80),
(18,1,1,FALSE,130),
(19,2,2,TRUE,75),
(20,2,2,FALSE,90),
(21,3,3,TRUE,45),
(22,3,3,FALSE,65),
(23,4,4,TRUE,35),
(24,4,4,FALSE,60),
(25,1,1,TRUE,70),
(26,1,1,FALSE,140),
(27,2,2,TRUE,65),
(28,2,2,FALSE,85),
(29,3,3,TRUE,40),
(30,3,3,FALSE,75);

INSERT INTO Run_Checkpoints (Run_id, Blood_current, Level_checkpoint) VALUES

(1, 90,1),(2, 80,1),(3, 85,2),(4, 70,2),(5, 60,3),
(6, 55,3),(7, 50,4),(8, 45,4),(9, 95,1),(10,75,1),
(11,80,2),(12,65,2),(13,55,3),(14,60,3),(15,45,4),
(16,50,4),(17,85,1),(18,70,1),(19,75,2),(20,60,2),
(21,50,3),(22,55,3),(23,40,4),(24,45,4),(25,90,1),
(26,65,1),(27,70,2),(28,55,2),(29,45,3),(30,50,3);

INSERT INTO Deck(
    Card_id, 
    Player_id, 
    Run_id, 
    Card_gained
    )

VALUES
(1,1,1,TRUE),
(2,2,2,TRUE),
(3,3,3,TRUE),
(4,4,4,FALSE),
(5,5,5,TRUE),
(6,6,6,FALSE),
(7,7,7,TRUE),
(8,8,8,TRUE),
(9,9,9,FALSE),
(10,10,10,TRUE),
(11,11,11,TRUE),
(12,12,12,FALSE),
(13,13,13,TRUE),
(14,14,14,TRUE),
(15,15,15,FALSE),
(16,16,16,TRUE),
(17,17,17,TRUE),
(18,18,18,FALSE),
(1,19,19,TRUE),
(2,20,20,TRUE),
(3,21,21,FALSE),
(4,22,22,TRUE),
(5,23,23,TRUE),
(6,24,24,FALSE),
(7,25,25,TRUE),
(8,26,26,TRUE),
(9,27,27,FALSE),
(10,28,28,TRUE),
(11,29,29,TRUE),
(12,30,30,FALSE);

INSERT INTO Enemy (Level_id, Enemy_name, Blood_pool)
VALUES
(1, 'Arantza', 50),
(2, 'Monique', 80),
(3, 'Monique enojada', 100),
(4, 'Arantza Monique', 100);


INSERT INTO Enemy_Cards (Enemy_id, Card_id)
VALUES

-- Enemy 1 (Tutorial)
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),

-- Enemy 2 (Nivel 1)
(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),(2,11),(2,12),

-- Enemy 3 (Nivel 2)
(3,9),(3,10),(3,11),(3,12),(3,13),(3,14),(3,15),(3,16),

-- Enemy 4 (Nivel 3)
(4,11),(4,12),(4,13),(4,14),(4,15),(4,16),(4,17),(4,18);

INSERT INTO Secrets (Secret_name, Content) VALUES
('El Primer Ritual', 'Todo comenzó con un experimento fallido en el sótano del hospital...'),
('Verdad Oculta', 'Los doctores sabían lo que hacían. Todos lo sabían.'),
('Salida Secreta', 'No la verdad no sé que más poner aqui mi cerebro esta muerto'),
('La Puerta Sellada', 'Nadie recuerda quién cerró la puerta. Solo saben que nunca debe abrirse.'),
('Sangre en las Paredes', 'Las manchas no son pintura. Nunca lo fueron.'),
('El Niño Perdido', 'Dicen que sigue vagando por los pasillos, buscando su nombre.'),
('La Primera Víctima', 'Su expediente fue borrado. Su historia, no.'),
('Sombra sin Dueño', 'La sombra en el pasillo no corresponde a nadie presente.'),
('El Reloj Detenido', 'Todas las agujas apuntan a las 3:17. Nadie sabe por qué.'),
('Escritura en el Suelo', 'Las palabras están grabadas con algo más duro que un clavo.'),
('El Espejo Roto', 'Cada fragmento refleja una cara diferente. Ninguna es la tuya.'),
('Voz en el Sótano', 'La grabación muestra una voz que nadie recuerda haber dejado.'),
('Verdad Oculta', 'Los maestros sabían lo que hacían. Todos lo sabían.'),
('El Salón Prohibido', 'El aula 13 fue clausurada después del incidente de 1987.'),
('La Lista de Nombres', 'Todos los nombres en la lista desaparecieron el mismo año.'),
('Diario de un Alumno', 'Las últimas páginas están arrancadas. Las anteriores, manchadas.'),
('El Trofeo Extraño', 'El trofeo lleva una fecha que aún no ha llegado.'),
('Foto de Graduación', 'En la foto hay una figura que no estaba en la ceremonia.'),
('La Campana', 'Suena cada noche a medianoche. El edificio lleva años abandonado.'),
('Mapa del Sótano', 'El mapa muestra habitaciones que no aparecen en los planos oficiales.'),
('El Maestro Olvidado', 'Su nombre fue eliminado de todos los registros en una sola noche.'),
('Cuaderno sin Dueño', 'Cada página contiene el mismo nombre escrito cientos de veces.'),
('Expediente 001', 'El primer paciente nunca fue dado de alta. Tampoco fue registrado como fallecido.'),
('La Sala de Operaciones','La sala 7 fue sellada tras una operación que ningún médico recuerda haber realizado.'),
('Receta Prohibida', 'El medicamento en la receta no existe en ningún catálogo farmacéutico.'),
('El Turno de Noche', 'Tres enfermeras reportaron ver lo mismo. Las tres renunciaron al día siguiente.'),
('Historial Borrado', 'El sistema eliminó el historial solo. Los logs no muestran ningún usuario activo.'),
('La Ambulancia', 'Llegó sin llamarla. Se fue sin llevarse a nadie visible.'),
('Sangre Tipo X', 'El tipo de sangre en las muestras no coincide con ninguno conocido.'),
('El Paciente 0', 'Su nombre solo aparece en un documento. El documento está fechado en el futuro.'),
('Radiografía Anómala', 'La imagen muestra una estructura dentro del cuerpo que no tiene nombre.'),
('La Última Llamada', 'La llamada de emergencia dura 3 minutos. No hay voz. Solo respiración.'),
('Fórmula Incompleta', 'Los últimos pasos del experimento fueron arrancados del cuaderno.'),
('Muestra Viva', 'La muestra en el frasco sigue moviéndose. El experimento terminó hace 20 años.'),
('El Científico', 'Sus notas describen algo que no debería ser posible. Sus notas tienen razón.'),
('Protocolo Omega', 'El protocolo nunca fue aprobado. Aun así, fue ejecutado.'),
('Registro de Errores', 'El sistema registró 9999 errores críticos. El máximo posible es 9998.'),
('La Criatura', 'El expediente describe su apariencia con todo detalle. La descripción cambia cada vez que se lee.'),
('Energía Desconocida', 'Los sensores detectaron una frecuencia que no debería existir en la naturaleza.'),
('El Último Informe', 'Fue enviado a las 4:44 AM. El edificio estaba vacío desde medianoche.');

INSERT INTO Chest (
    Labyrinth_id, 
    Secret_id, 
    Blood_amount, 
    Position_x,  -- las posiciones son dependientes del diseño del laberinto 
    Position_y 
    )
VALUES

-- Cofres de nivel 1 (tutorial) 
(1,1,10,5,5),
(1,2,15,10,3),
(1,3,20,2,8),
(1,4,5,7,7),
(1,5,12,6,4),
(1,6,8,3,9),
(1,7,14,11,1),
(1,8,9,8,6),
(1,9,11,4,10),
(1,10,7,12,2),

-- Cofres de nivel 2 (Escuela)
(2,11,10,5,5),
(2,12,15,10,3),
(2,13,20,2,8),
(2,14,5,7,7),
(2,15,12,6,4),
(2,16,8,3,9),
(2,17,14,11,1),
(2,18,9,8,6),
(2,19,11,4,10),
(2,20,7,12,2),


-- Cofres de nivel 3 (Hospital)
(3,21,10,5,5),
(3,22,15,10,3),
(3,23,20,2,8),
(3,24,5,7,7),
(3,25,12,6,4),
(3,26,8,3,9),
(3,27,14,11,1),
(3,28,9,8,6),
(3,29,11,4,10),
(3,30,7,12,2),

-- Cofres de nivel 4 (Laboratorio)

(4,31,10,5,5),
(4,32,15,10,3),
(4,33,20,2,8),
(4,34,5,7,7),
(4,35,12,6,4),
(4,36,8,3,9),
(4,37,14,11,1),
(4,38,9,8,6),
(4,39,11,4,10),
(4,40,7,12,2);


INSERT INTO Chest_card (Chest_id, Card_id)
-- Cofres con cartas, si el cofre 1 ess generado, su carta seria la 1. 
VALUES
(1,1),
(2,2),
(3,3),
(4,4),
(5,5),
(6,6),
(7,7),
(8,8),
(9,9),
(10,10),
(11,11),
(12,12),
(13,13),
(14,14),
(15,15),
(16,16),
(17,17),
(18,18),
(19,1),
(20,2),
(21,3),
(22,4),
(23,5),
(24,6),
(25,7),
(26,8),
(27,9),
(28,10),
(29,11),
(30,12);

INSERT INTO Combat (
    Player_id,
    Enemy_id,
    Run_id,
    Level_id,
    Result,
    Blood_used,
    Player_card_to_defeat,
    Enemy_card_to_defeat,
    Total_turns,
    Player_KO,
    Enemy_KO,
    Ended_at
)
VALUES
(1, 1, 1, 1, 'player_win', 9, 2, 0, 6, 1, 3, NOW()), -- jugador 1 combate real sim 
(2,1,2,1,'enemy_win',12,0,1,7,3,2,NOW()),
(3,1,3,1,'player_win',8,1,0,5,2,3,NOW()),
(4,1,4,1,'player_win',9,2,0,6,1,3,NOW()),
(5,1,5,1,'enemy_win',11,0,1,8,3,2,NOW()),
(6,1,6,1,'player_win',7,1,0,5,2,3,NOW()),
(7,1,7,1,'player_win',10,2,0,6,1,3,NOW()),
(8,2,8,2,'enemy_win',14,0,1,9,3,2,NOW()),
(9,2,9,2,'player_win',12,1,0,7,2,3,NOW()),
(10,2,10,2,'player_win',11,2,0,6,1,3,NOW()),
(11,2,11,2,'enemy_win',13,0,1,8,3,2,NOW()),
(12,2,12,2,'player_win',10,1,0,7,2,3,NOW()),
(13,2,13,2,'player_win',9,2,0,6,1,3,NOW()),
(14,2,14,2,'enemy_win',15,0,1,9,3,2,NOW()),
(15,3,15,3,'player_win',16,1,0,8,2,3,NOW()),
(16,3,16,3,'enemy_win',18,0,1,10,3,2,NOW()),
(17,3,17,3,'player_win',14,2,0,7,1,3,NOW()),
(18,3,18,3,'player_win',15,1,0,8,2,3,NOW()),
(19,3,19,3,'enemy_win',17,0,1,9,3,2,NOW()),
(20,3,20,3,'player_win',13,2,0,7,1,3,NOW()),
(21,3,21,3,'player_win',14,1,0,8,2,3,NOW()),
(22,4,22,4,'enemy_win',20,0,1,11,3,2,NOW()),
(23,4,23,4,'player_win',18,1,0,9,2,3,NOW()),
(24,4,24,4,'enemy_win',21,0,1,12,3,2,NOW()),
(25,4,25,4,'player_win',17,2,0,8,1,3,NOW()),
(26,4,26,4,'player_win',19,1,0,10,2,3,NOW()),
(27,4,27,4,'enemy_win',22,0,1,12,3,2,NOW()),
(28,4,28,4,'player_win',16,2,0,9,1,3,NOW()),
(29,4,29,4,'player_win',18,1,0,10,2,3,NOW()),
(30,4,30,4,'enemy_win',20,0,1,11,3,2,NOW());

INSERT INTO Combat_Turns (
    Combat_id,
    Turn_number,
    Active_player,
    Blood_spent
) 
VALUES 
-- jugador 1 combate real sim 
(1, 1, 'Player', 2),
(1, 2, 'Enemy', 1),
(1, 3, 'Player', 3),
(1, 4, 'Enemy', 1),
(1, 5, 'Player', 2),
(1, 6, 'Enemy', 0),



(2,1,'Player',3),(2,2,'Enemy',2),
(3,1,'Player',2),(3,2,'Enemy',1),
(4,1,'Player',2),(4,2,'Enemy',2),
(5,1,'Player',3),(5,2,'Enemy',2),
(6,1,'Player',2),(6,2,'Enemy',1),
(7,1,'Player',2),(7,2,'Enemy',2),
(8,1,'Player',3),(8,2,'Enemy',2),
(9,1,'Player',2),(9,2,'Enemy',2),
(10,1,'Player',2),(10,2,'Enemy',1),

(11,1,'Player',3),(11,2,'Enemy',2),
(12,1,'Player',2),(12,2,'Enemy',1),
(13,1,'Player',2),(13,2,'Enemy',2),
(14,1,'Player',3),(14,2,'Enemy',2),
(15,1,'Player',4),(15,2,'Enemy',2),
(16,1,'Player',4),(16,2,'Enemy',3),
(17,1,'Player',3),(17,2,'Enemy',2),
(18,1,'Player',3),(18,2,'Enemy',2),
(19,1,'Player',4),(19,2,'Enemy',3),
(20,1,'Player',3),(20,2,'Enemy',2),

(21,1,'Player',3),(21,2,'Enemy',2),
(22,1,'Player',5),(22,2,'Enemy',3),
(23,1,'Player',4),(23,2,'Enemy',2),
(24,1,'Player',5),(24,2,'Enemy',3),
(25,1,'Player',4),(25,2,'Enemy',2),
(26,1,'Player',4),(26,2,'Enemy',3),
(27,1,'Player',5),(27,2,'Enemy',3),
(28,1,'Player',4),(28,2,'Enemy',2),
(29,1,'Player',4),(29,2,'Enemy',3),
(30,1,'Player',5),(30,2,'Enemy',3);

INSERT INTO Combat_Cards_Actions (
    Combat_id,
    Turn_id,
    Card_id,
    Action_type,
    Used_by,
    Blood_spent,
    Damage_dealt,
    HP_before,
    HP_after,
    Card_dead
)
VALUES

(1, 1, 1, 'Attack', 'Player', 2, 4, 12, 8,  FALSE),
(1, 2, 2, 'Attack', 'Enemy',  1, 3, 10, 7,  FALSE),
(1, 3, 3, 'Attack', 'Player', 3, 6,  8, 2,  FALSE),
(1, 4, 4, 'Attack', 'Enemy',  1, 2,  7, 5,  FALSE),
(1, 5, 5, 'Attack', 'Player', 2, 3,  2, 0,  TRUE),
(2,  7, 3,  'Attack', 'Player', 3, 6, 14, 8,  FALSE),
(2,  8, 4,  'Attack', 'Enemy',  2, 5, 12, 7,  FALSE),
(3,  9, 5,  'Attack', 'Player', 2, 4, 11, 7,  FALSE),
(3, 10, 6,  'Attack', 'Enemy',  1, 3,  9, 6,  FALSE),
(4, 11, 7,  'Attack', 'Player', 2, 5, 13, 8,  FALSE),
(4, 12, 8,  'Attack', 'Enemy',  2, 4, 12, 8,  FALSE),
(5, 13, 9,  'Attack', 'Player', 3, 6, 15, 9,  FALSE),
(5, 14, 10, 'Attack', 'Enemy',  2, 5, 14, 9,  FALSE),
(6, 15, 11, 'Attack', 'Player', 2, 4, 12, 8,  FALSE),
(6, 16, 12, 'Attack', 'Enemy',  1, 3, 10, 7,  FALSE),
(7, 17, 13, 'Attack', 'Player', 2, 5, 13, 8,  FALSE),
(7, 18, 14, 'Attack', 'Enemy',  2, 4, 12, 8,  FALSE),
(8, 19, 15, 'Attack', 'Player', 3, 6, 16, 10, FALSE),
(8, 20, 16, 'Attack', 'Enemy',  2, 5, 15, 10, FALSE),
(9, 21, 17, 'Attack', 'Player', 2, 5, 12, 7,  FALSE),
(9, 22, 18, 'Attack', 'Enemy',  2, 4, 11, 7,  FALSE),
(10, 23, 1, 'Attack', 'Player', 2, 5, 12, 7,  FALSE),
(10, 24, 2, 'Attack', 'Enemy',  1, 4, 10, 6,  FALSE),
(11, 25, 3, 'Attack', 'Player', 3, 6, 14, 8,  FALSE),
(11, 26, 4, 'Attack', 'Enemy',  2, 5, 12, 7,  FALSE),
(12, 27, 5, 'Attack', 'Player', 2, 4, 11, 7,  FALSE),
(12, 28, 6, 'Attack', 'Enemy',  1, 3,  9, 6,  FALSE),
(13, 29, 7, 'Attack', 'Player', 2, 5, 13, 8,  FALSE),
(13, 30, 8, 'Attack', 'Enemy',  2, 4, 12, 8,  FALSE),
(14, 31, 9,  'Attack', 'Player', 3, 6, 15, 9,  FALSE),
(14, 32, 10, 'Attack', 'Enemy',  2, 5, 14, 9,  FALSE),
(15, 33, 11, 'Attack', 'Player', 4, 7, 16, 9,  FALSE),
(15, 34, 12, 'Attack', 'Enemy',  2, 5, 15, 10, FALSE),
(16, 35, 13, 'Attack', 'Player', 4, 8, 17, 9,  FALSE),
(16, 36, 14, 'Attack', 'Enemy',  3, 6, 16, 10, FALSE),
(17, 37, 15, 'Attack', 'Player', 3, 6, 14, 8,  FALSE),
(17, 38, 16, 'Attack', 'Enemy',  2, 5, 13, 8,  FALSE),
(18, 39, 17, 'Attack', 'Player', 3, 7, 15, 8,  FALSE),
(18, 40, 18, 'Attack', 'Enemy',  2, 5, 14, 9,  FALSE),
(19, 41, 1, 'Attack', 'Player', 4, 8, 16, 8,  FALSE),
(19, 42, 2, 'Attack', 'Enemy',  3, 6, 15, 9,  FALSE),
(20, 43, 3, 'Attack', 'Player', 3, 6, 14, 8,  FALSE),
(20, 44, 4, 'Attack', 'Enemy',  2, 5, 13, 8,  FALSE),
(21, 45, 5, 'Attack', 'Player', 3, 6, 14, 8,  FALSE),
(21, 46, 6, 'Attack', 'Enemy',  2, 5, 13, 8,  FALSE),
(22, 47, 7, 'Attack', 'Player', 5, 9, 18, 9,  FALSE),
(22, 48, 8, 'Attack', 'Enemy',  3, 7, 17, 10, FALSE),
(23, 49, 9,  'Attack', 'Player', 4, 8, 16, 8,  FALSE),
(23, 50, 10, 'Attack', 'Enemy',  2, 6, 15, 9,  FALSE),
(24, 51, 11, 'Attack', 'Player', 5, 9, 18, 9,  FALSE),
(24, 52, 12, 'Attack', 'Enemy',  3, 7, 17, 10, FALSE),
(25, 53, 13, 'Attack', 'Player', 4, 8, 16, 8,  FALSE),
(25, 54, 14, 'Attack', 'Enemy',  2, 6, 15, 9,  FALSE),
(26, 55, 15, 'Attack', 'Player', 4, 8, 17, 9,  FALSE),
(26, 56, 16, 'Attack', 'Enemy',  3, 7, 16, 9,  FALSE),
(27, 57, 17, 'Attack', 'Player', 5, 9, 18, 9,  FALSE),
(27, 58, 18, 'Attack', 'Enemy',  3, 7, 17, 10, FALSE),
(28, 59, 1, 'Attack', 'Player', 4, 8, 16, 8,  FALSE),
(28, 60, 2, 'Attack', 'Enemy',  2, 6, 15, 9,  FALSE),
(29, 61, 3, 'Attack', 'Player', 4, 8, 17, 9,  FALSE),
(29, 62, 4, 'Attack', 'Enemy',  3, 7, 16, 9,  FALSE),
(30, 63, 5, 'Attack', 'Player', 5, 9, 18, 9,  FALSE),
(30, 64, 6, 'Attack', 'Enemy',  3, 7, 17, 10, FALSE);

INSERT INTO Logs_combat (
    Combat_id,
    Enemy_id,
    Turn_id,
    Log_data
)
VALUES
(1,  1,  1,  'txt log del combate'),
(2,  1,  7,  'txt log del combate'),
(3,  1,  9,  'txt log del combate'),
(4,  1,  11, 'txt log del combate'),
(5,  1,  13, 'txt log del combate'),
(6,  1,  15, 'txt log del combate'),
(7,  1,  17, 'txt log del combate'),
(8,  2,  19, 'txt log del combate'),
(9,  2,  21, 'txt log del combate'),
(10, 2,  23, 'txt log del combate'),
(11, 2,  25, 'txt log del combate'),
(12, 2,  27, 'txt log del combate'),
(13, 2,  29, 'txt log del combate'),
(14, 2,  31, 'txt log del combate'),
(15, 3,  33, 'txt log del combate'),
(16, 3,  35, 'txt log del combate'),
(17, 3,  37, 'txt log del combate'),
(18, 3,  39, 'txt log del combate'),
(19, 3,  41, 'txt log del combate'),
(20, 3,  43, 'txt log del combate'),
(21, 3,  45, 'txt log del combate'),
(22, 4,  47, 'txt log del combate'),
(23, 4,  49, 'txt log del combate'),
(24, 4,  51, 'txt log del combate'),
(25, 4,  53, 'txt log del combate'),
(26, 4,  55, 'txt log del combate'),
(27, 4,  57, 'txt log del combate'),
(28, 4,  59, 'txt log del combate'),
(29, 4,  61, 'txt log del combate'),
(30, 4,  63, 'txt log del combate');

INSERT INTO Player_Chest_Opened (Player_id, Chest_id, Run_id)
VALUES
(1,1,1),
(2,2,2),
(3,3,3),
(4,4,4),
(5,5,5),
(6,6,6),
(7,7,7),
(8,8,8),
(9,9,9),
(10,10,10),
(11,11,11),
(12,12,12),
(13,13,13),
(14,14,14),
(15,15,15),
(16,16,16),
(17,17,17),
(18,18,18),
(19,19,19),
(20,20,20),
(21,21,21),
(22,22,22),
(23,23,23),
(24,24,24),
(25,25,25),
(26,26,26),
(27,27,27),
(28,28,28),
(29,29,29),
(30,30,30);



-- tabla item 

INSERT INTO Player_Items (Player_id, Item_name, Is_active) VALUES
(1,  'Carta: Acechador Carmesí',    TRUE),
(2,  'Carta: Bestia del Abismo',    TRUE),
(3,  'Carta: Blood Stalker',        TRUE),
(4,  'Carta: Caballero de Sangre',  TRUE),
(5,  'Carta: Caballero de la Plaga',TRUE),
(6,  'Carta: Emperador Julian',     TRUE),
(7,  'Carta: Epstien',              TRUE),
(8,  'Carta: Espectro Nocturno',    TRUE),
(9,  'Carta: Grave Whisper',        TRUE),
(10, 'Carta: Guardián Colosal',     TRUE),
(11, 'Secreto: El Primer Ritual',   TRUE),
(12, 'Secreto: La Puerta Sellada',  TRUE),
(13, 'Secreto: Sangre en las Paredes', TRUE),
(14, 'Secreto: El Niño Perdido',    TRUE),
(15, 'Secreto: La Primera Víctima', TRUE),
(16, 'Llave de la Escuela',         TRUE),
(17, 'Llave del Hospital',          TRUE),
(18, 'Llave del Laboratorio',       TRUE),
(19, 'Fragmento de Mapa: Escuela',  TRUE),
(20, 'Fragmento de Mapa: Hospital', TRUE),
(21, 'Fragmento de Mapa: Laboratorio', TRUE),
(22, 'Secreto: Sombra sin Dueño',   TRUE),
(23, 'Secreto: El Reloj Detenido',  TRUE),
(24, 'Carta: JB',                   TRUE),
(25, 'Carta: El Rey Julen',         TRUE),
(26, 'Secreto: Expediente 001',     TRUE),
(27, 'Secreto: La Sala de Operaciones', TRUE),
(28, 'Carta: Sauron',               TRUE),
(29, 'Secreto: Fórmula Incompleta', TRUE),
(30, 'Secreto: Fin del Experimento',TRUE);