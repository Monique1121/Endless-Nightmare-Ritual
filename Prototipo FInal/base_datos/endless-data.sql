
USE endless;


INSERT INTO Users (Username, Password_user) VALUES
('Julian', '12345'),
('monikkkkk', '1234'),
('Juan', 'night'),
('Esteban', 'mysql'),
('Gilberto', 'delta'),
('Angel', 'html');


INSERT INTO Cards (Card_name, Blood_cost, Damage, HP, Sprite_path) VALUES
('Acechador Carmesi', 4, 5, 10, '../assets/cards/achador.png'),
('Bestia del Abismo', 10, 10, 18, '../assets/cards/bestia_del_Abismo.png'),
('Blood Stalker', 8, 9, 14, '../assets/cards/Blood_stalker.png'),
('Caballero de Sangre', 9, 8, 16, '../assets/cards/caballero_sangre.png'),
('Caballero de la Plaga', 8, 8, 15, '../assets/cards/caballero_plaga.png'),
('Emperador Julian', 7, 7, 14, '../assets/cards/EmperadorJB.png'),
('Epstein', 6, 6, 10, '../assets/cards/epstein.png'),
('Espectro Nocturno', 5, 7, 12, '../assets/cards/espectro_nocturno.png'),
('Grave Whisper', 3, 5, 10, '../assets/cards/Grave_whisperer.png'),
('Guardian Colosal', 10, 9, 18, '../assets/cards/guardian_colosal.png'),
('JB', 12, 11, 20, '../assets/cards/JBcard.png'),
('Pesadilla', 6, 6, 11, '../assets/cards/pesadilla.png'),
('El Rey Julen', 9, 10, 16, '../assets/cards/ReyJB.png'),
('Sacerdotisa Carmesi', 7, 7, 14, '../assets/cards/sarcedostista.png'),
('Sauron', 10, 9, 18, '../assets/cards/sauron.png'),

-- raras
('Senor de la Cripta', 9, 9, 16, 'assets/cards/senor_cripta.png'),
('Simmon el Tenebroso', 10, 10, 14, 'assets/cards/simmon.png'),
('TZA la bruja', 8, 8, 12, 'assets/cards/TZA_bruja.png'),
('Sombra Voraz', 4, 5, 10, 'assets/cards/sombra_voraz.png'),
('Latigo Umbral', 5, 6, 10, 'assets/cards/latigo_umbral.png'),
('Criatura de la Niebla', 6, 6, 11, 'assets/cards/criatura_niebla.png'),
('Engendro Oscuro', 6, 7, 12, 'assets/cards/engendro_oscuro.png'),
('Devorador de Almas', 7, 7, 13, 'assets/cards/devorador_almas.png'),
('Fantasma Errante', 7, 8, 12, 'assets/cards/fantasma_errante.png'),
('Hechicero Maldito', 9, 9, 14, 'assets/cards/hechicero_maldito.png'),
('Golem de Huesos', 8, 9, 15, 'assets/cards/golem_huesos.png'),
('Vampiro Ancestral', 9, 9, 16, 'assets/cards/vampiro_ancestral.png'),
('Liche Eterno', 10, 10, 18, 'assets/cards/liche_eterno.png'),
('Demonio Menor', 10, 11, 18, 'assets/cards/demonio_menor.png'),
('Senor del Caos', 11, 11, 20, 'assets/cards/senor_caos.png'),

-- épicas (más controladas)
('Dragon de Sombras', 10, 11, 18, 'assets/cards/dragon_sombras.png'),
('Titan Corrupto', 11, 11, 20, 'assets/cards/titan_corrupto.png'),
('Archimago Oscuro', 10, 10, 18, 'assets/cards/archimago_oscuro.png'),
('Leviatan', 11, 12, 20, 'assets/cards/leviatan.png'),
('JB el Inmortal', 12, 12, 24, 'assets/cards/JB_inmortal.png');

INSERT INTO Levels (Level_name, Level_number, Enemy_name) VALUES
('Tutorial', 0, 'Arantza Basica'),
('Escuela', 1, 'Monique'),
('Hospital', 2, 'Monique Enojada'),
('Laboratorio', 3, 'Arantza y Monique');

-- ============================================
-- LABERINTOS (uno por nivel)
-- ============================================
INSERT INTO Labyrinth (Level_id, Time_limit) VALUES
(1, 420),  -- Tutorial: 7 minutos
(2, 240),  -- Escuela: 4 minutos
(3, 90),   -- Hospital: 1.5 minutos
(4, 60);   -- Laboratorio: 1 minuto

-- ============================================
-- ENEMIGOS
-- ============================================
INSERT INTO Enemy (Level_id, Enemy_name, Blood_pool) VALUES
(1, 'Arantza Basica', 50),
(2, 'Monique', 80),
(3, 'Monique Enojada', 100),
(4, 'Arantza y Monique', 150);

-- Mazos de enemigos
INSERT INTO Enemy_Cards (Enemy_id, Card_id) VALUES
-- Enemy 1 (Tutorial) - Cartas básicas
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),

-- Enemy 2 (Escuela) - Cartas intermedias
(2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12),

-- Enemy 3 (Hospital) - Cartas avanzadas
(3, 9), (3, 10), (3, 11), (3, 12), (3, 13), (3, 14), (3, 15), (3, 16),

-- Enemy 4 (Laboratorio) - Cartas poderosas
(4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16), (4, 17), (4, 18);

-- ============================================
-- SECRETOS (40 secretos de horror - SIN ACENTOS)
-- ============================================
INSERT INTO Secrets (Secret_name, Content) VALUES
('El Primer Ritual', 'Todo comenzo con un experimento fallido en el sotano del hospital...'),
('Verdad Oculta', 'Los doctores sabian lo que hacian. Todos lo sabian.'),
('La Puerta Sellada', 'Nadie recuerda quien cerro la puerta. Solo saben que nunca debe abrirse.'),
('Sangre en las Paredes', 'Las manchas no son pintura. Nunca lo fueron.'),
('El Nino Perdido', 'Dicen que sigue vagando por los pasillos, buscando su nombre.'),
('La Primera Victima', 'Su expediente fue borrado. Su historia, no.'),
('Sombra sin Dueno', 'La sombra en el pasillo no corresponde a nadie presente.'),
('El Reloj Detenido', 'Todas las agujas apuntan a las 3:17. Nadie sabe por que.'),
('Escritura en el Suelo', 'Las palabras estan grabadas con algo mas duro que un clavo.'),
('El Espejo Roto', 'Cada fragmento refleja una cara diferente. Ninguna es la tuya.'),
('Voz en el Sotano', 'La grabacion muestra una voz que nadie recuerda haber dejado.'),
('El Pasillo Infinito', 'Cuentan los pasos. Siempre son mas de los que deberian.'),
('El Salon Prohibido', 'El aula 13 fue clausurada despues del incidente de 1987.'),
('La Lista de Nombres', 'Todos los nombres en la lista desaparecieron el mismo ano.'),
('Diario de un Alumno', 'Las ultimas paginas estan arrancadas. Las anteriores, manchadas.'),
('El Trofeo Extrano', 'El trofeo lleva una fecha que aun no ha llegado.'),
('Foto de Graduacion', 'En la foto hay una figura que no estaba en la ceremonia.'),
('La Campana', 'Suena cada noche a medianoche. El edificio lleva anos abandonado.'),
('Mapa del Sotano', 'El mapa muestra habitaciones que no aparecen en los planos oficiales.'),
('El Maestro Olvidado', 'Su nombre fue eliminado de todos los registros en una sola noche.'),
('Cuaderno sin Dueno', 'Cada pagina contiene el mismo nombre escrito cientos de veces.'),
('Expediente 001', 'El primer paciente nunca fue dado de alta. Tampoco fue registrado como fallecido.'),
('La Sala de Operaciones', 'La sala 7 fue sellada tras una operacion que ningun medico recuerda haber realizado.'),
('Receta Prohibida', 'El medicamento en la receta no existe en ningun catalogo farmaceutico.'),
('El Turno de Noche', 'Tres enfermeras reportaron ver lo mismo. Las tres renunciaron al dia siguiente.'),
('Historial Borrado', 'El sistema elimino el historial solo. Los logs no muestran ningun usuario activo.'),
('La Ambulancia', 'Llego sin llamarla. Se fue sin llevarse a nadie visible.'),
('Sangre Tipo X', 'El tipo de sangre en las muestras no coincide con ninguno conocido.'),
('El Paciente 0', 'Su nombre solo aparece en un documento. El documento esta fechado en el futuro.'),
('Radiografia Anomala', 'La imagen muestra una estructura dentro del cuerpo que no tiene nombre.'),
('La Ultima Llamada', 'La llamada de emergencia dura 3 minutos. No hay voz. Solo respiracion.'),
('Formula Incompleta', 'Los ultimos pasos del experimento fueron arrancados del cuaderno.'),
('Muestra Viva', 'La muestra en el frasco sigue moviendose. El experimento termino hace 20 anos.'),
('El Cientifico', 'Sus notas describen algo que no deberia ser posible. Sus notas tienen razon.'),
('Protocolo Omega', 'El protocolo nunca fue aprobado. Aun asi, fue ejecutado.'),
('Registro de Errores', 'El sistema registro 9999 errores criticos. El maximo posible es 9998.'),
('La Criatura', 'El expediente describe su apariencia con todo detalle. La descripcion cambia cada vez que se lee.'),
('Energia Desconocida', 'Los sensores detectaron una frecuencia que no deberia existir en la naturaleza.'),
('El Ultimo Informe', 'Fue enviado a las 4:44 AM. El edificio estaba vacio desde medianoche.'),
('El Origen', 'Todo comenzo aqui. Todo terminara aqui.');

-- ============================================
-- COFRES (40 cofres - 10 por nivel)
-- ============================================
INSERT INTO Chest (Labyrinth_id, Secret_id, Blood_amount, Position_x, Position_y) VALUES
-- Cofres Nivel 1 (Tutorial)
(1, 1, 10, 5, 5),
(1, 2, 15, 10, 3),
(1, 3, 20, 2, 8),
(1, 4, 5, 7, 7),
(1, 5, 12, 6, 4),
(1, 6, 8, 3, 9),
(1, 7, 14, 11, 1),
(1, 8, 9, 8, 6),
(1, 9, 11, 4, 10),
(1, 10, 7, 12, 2),

-- Cofres Nivel 2 (Escuela)
(2, 11, 10, 5, 5),
(2, 12, 15, 10, 3),
(2, 13, 20, 2, 8),
(2, 14, 5, 7, 7),
(2, 15, 12, 6, 4),
(2, 16, 8, 3, 9),
(2, 17, 14, 11, 1),
(2, 18, 9, 8, 6),
(2, 19, 11, 4, 10),
(2, 20, 7, 12, 2),

-- Cofres Nivel 3 (Hospital)
(3, 21, 10, 5, 5),
(3, 22, 15, 10, 3),
(3, 23, 20, 2, 8),
(3, 24, 5, 7, 7),
(3, 25, 12, 6, 4),
(3, 26, 8, 3, 9),
(3, 27, 14, 11, 1),
(3, 28, 9, 8, 6),
(3, 29, 11, 4, 10),
(3, 30, 7, 12, 2),

-- Cofres Nivel 4 (Laboratorio)
(4, 31, 10, 5, 5),
(4, 32, 15, 10, 3),
(4, 33, 20, 2, 8),
(4, 34, 5, 7, 7),
(4, 35, 12, 6, 4),
(4, 36, 8, 3, 9),
(4, 37, 14, 11, 1),
(4, 38, 9, 8, 6),
(4, 39, 11, 4, 10),
(4, 40, 7, 12, 2);

-- Asignación de cartas a cofres (cada cofre tiene una carta)
INSERT INTO Chest_card (Chest_id, Card_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10),
(11, 11), (12, 12), (13, 13), (14, 14), (15, 15), (16, 16), (17, 17), (18, 18), (19, 19), (20, 20),
(21, 21), (22, 22), (23, 23), (24, 24), (25, 25), (26, 26), (27, 27), (28, 28), (29, 29), (30, 30),
(31, 31), (32, 32), (33, 33), (34, 34), (35, 35), (36, 1), (37, 2), (38, 3), (39, 4), (40, 5);

SELECT * FROM Deck WHERE Player_id = 1 AND Card_gained = FALSE;

SELECT d.Deck_id, d.Card_id, c.Card_name, d.Run_id, d.Card_gained 
FROM Deck d
JOIN Cards c ON d.Card_id = c.Card_id
WHERE d.Player_id = 1
ORDER BY d.Created_at DESC;



