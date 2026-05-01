#schema endless 

DROP DATABASE IF EXISTS endless;
CREATE DATABASE endless;
USE endless;

CREATE TABLE Users (
    User_id INT AUTO_INCREMENT NOT NULL,
    Username VARCHAR(45) NOT NULL UNIQUE,
    Password_hash VARCHAR(255) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_login TIMESTAMP NULL,
    Is_active BOOLEAN DEFAULT TRUE,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (User_id),
    INDEX idx_username (Username)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Player (
    Player_id INT AUTO_INCREMENT NOT NULL, 
    User_id INT NOT NULL,
    Player_name VARCHAR(45) NOT NULL,
    Blood_max SMALLINT NOT NULL DEFAULT 100,
    Blood_current SMALLINT NOT NULL DEFAULT 100,
    Level SMALLINT NOT NULL DEFAULT 0,
    School_unlocked BOOLEAN DEFAULT TRUE,  
    Hospital_unlocked BOOLEAN DEFAULT FALSE,
    Laboratory_unlocked BOOLEAN DEFAULT FALSE,
    Secrets_discovered SMALLINT NOT NULL DEFAULT 0,
    Total_playtime INT NOT NULL DEFAULT 0,
    Achievements_unlocked SMALLINT NOT NULL DEFAULT 0,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Player_id),
    FOREIGN KEY (User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    INDEX idx_user (User_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Cards (
    Card_id INT AUTO_INCREMENT NOT NULL,
    Card_name VARCHAR(45) NOT NULL,
    Blood_cost SMALLINT NOT NULL DEFAULT 0,
    Damage SMALLINT NOT NULL DEFAULT 0,
    HP SMALLINT NOT NULL DEFAULT 1,
    Sprite_path VARCHAR(255),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Card_id),
    INDEX idx_cost (Blood_cost)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Levels (
    Level_id INT AUTO_INCREMENT NOT NULL,
    Level_name VARCHAR(45) NOT NULL,
    Level_number SMALLINT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Level_id),
    INDEX idx_level_number (Level_number)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Labyrinth (
    Labyrinth_id INT AUTO_INCREMENT NOT NULL,
    Level_id INT NOT NULL,
    Time_limit SMALLINT NOT NULL DEFAULT 60,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Labyrinth_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id) ON DELETE CASCADE,
    INDEX idx_level (Level_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Run (
    Run_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Labyrinth_id INT NOT NULL,
    Level_id INT NOT NULL,
    Blood_recovered SMALLINT NOT NULL DEFAULT 0,
    Cards_found SMALLINT NOT NULL DEFAULT 0,
    Secrets_found SMALLINT NOT NULL DEFAULT 0,
    Completed BOOLEAN NOT NULL DEFAULT FALSE,
    Time_taken SMALLINT NOT NULL DEFAULT 0,
    Started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Completed_at TIMESTAMP NULL,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Run_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id) ON DELETE CASCADE,
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id),
    INDEX idx_player (Player_id),
    INDEX idx_completed (Completed)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Run_Checkpoints (
    Checkpoint_id INT AUTO_INCREMENT NOT NULL,
    Run_id INT NOT NULL,
    Blood_current SMALLINT NOT NULL,
    Level_checkpoint SMALLINT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Checkpoint_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE CASCADE,
    INDEX idx_run (Run_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Deck (
    Deck_id INT AUTO_INCREMENT NOT NULL,
    Card_id INT NOT NULL,
    Player_id INT NOT NULL,
    Run_id INT NULL,
    Card_gained BOOLEAN NOT NULL DEFAULT FALSE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Deck_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE SET NULL,
    INDEX idx_player (Player_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Enemy (
    Enemy_id INT AUTO_INCREMENT NOT NULL,
    Level_id INT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    Blood_pool SMALLINT NOT NULL DEFAULT 50,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Enemy_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id) ON DELETE CASCADE,
    INDEX idx_level (Level_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Enemy_Cards (
    Enemy_card_id INT AUTO_INCREMENT NOT NULL,
    Enemy_id INT NOT NULL,
    Card_id INT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Enemy_card_id),
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    UNIQUE KEY unique_enemy_card (Enemy_id, Card_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Secrets (
    Secret_id INT AUTO_INCREMENT NOT NULL,
    Secret_name VARCHAR(100) NOT NULL,
    Content TEXT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Secret_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Chest (
    Chest_id INT AUTO_INCREMENT NOT NULL,
    Labyrinth_id INT NOT NULL,
    Secret_id INT NULL,
    Blood_amount SMALLINT NOT NULL DEFAULT 0,
    Position_x SMALLINT NOT NULL,
    Position_y SMALLINT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Chest_id),
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id) ON DELETE CASCADE,
    FOREIGN KEY (Secret_id) REFERENCES Secrets(Secret_id) ON DELETE SET NULL,
    INDEX idx_labyrinth (Labyrinth_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Chest_card (
    Chest_card_id INT AUTO_INCREMENT NOT NULL,
    Chest_id INT NOT NULL,
    Card_id INT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Chest_card_id),
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    INDEX idx_chest (Chest_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Combat (
    Combat_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Enemy_id INT NOT NULL,
    Run_id INT NOT NULL,
    Level_id INT NOT NULL,
    Result VARCHAR(45) NULL,
    Blood_used INT NOT NULL DEFAULT 0,
    Player_card_to_defeat SMALLINT NOT NULL DEFAULT 3,
    Enemy_card_to_defeat SMALLINT NOT NULL DEFAULT 3,
    Total_turns SMALLINT NOT NULL DEFAULT 0,
    Player_KO SMALLINT NOT NULL DEFAULT 0,
    Enemy_KO SMALLINT NOT NULL DEFAULT 0,
    Started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Ended_at TIMESTAMP NULL,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Combat_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE CASCADE,
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id),
    INDEX idx_player (Player_id),
    INDEX idx_result (Result)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Combat_Turns (
    Turn_id INT AUTO_INCREMENT NOT NULL,
    Combat_id INT NOT NULL,
    Turn_number SMALLINT NOT NULL,
    Active_player VARCHAR(10),
    Blood_spent SMALLINT DEFAULT 0,
    Turn_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Turn_id),
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE,
    INDEX idx_combat (Combat_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Combat_Cards_Actions (
    Action_id INT AUTO_INCREMENT NOT NULL,
    Combat_id INT NOT NULL,
    Turn_id INT NOT NULL,
    Card_id INT NOT NULL,
    Action_type VARCHAR(45) NOT NULL,
    Used_by VARCHAR(45) NOT NULL,
    Blood_spent SMALLINT NOT NULL DEFAULT 0,
    Damage_dealt SMALLINT NOT NULL DEFAULT 0,
    HP_before SMALLINT NOT NULL,
    HP_after SMALLINT NOT NULL,
    Card_dead BOOLEAN NOT NULL DEFAULT FALSE,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Action_id),
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE,
    FOREIGN KEY (Turn_id) REFERENCES Combat_Turns(Turn_id) ON DELETE CASCADE,
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    INDEX idx_combat (Combat_id),
    INDEX idx_turn (Turn_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Logs_combat (
    Log_combat_id INT AUTO_INCREMENT NOT NULL,
    Combat_id INT NOT NULL,
    Enemy_id INT NOT NULL,
    Turn_id INT NOT NULL,
    Log_data TEXT,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Log_combat_id),
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id) ON DELETE CASCADE,
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Turn_id) REFERENCES Combat_Turns(Turn_id) ON DELETE CASCADE,
    INDEX idx_combat (Combat_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Player_Chest_Opened (
    Player_chest_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Chest_id INT NOT NULL,
    Run_id INT NULL,
    Opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Player_chest_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id) ON DELETE CASCADE,
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE SET NULL,
    UNIQUE KEY unique_player_chest (Player_id, Chest_id),
    INDEX idx_player (Player_id),
    INDEX idx_chest (Chest_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Player_Items (
    Player_item_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Item_name VARCHAR(50) NOT NULL,
    Obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Is_active BOOLEAN DEFAULT TRUE,
    
    PRIMARY KEY (Player_item_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_item (Player_id, Item_name),
    INDEX idx_player (Player_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- Vistas

-- Vista 1: Estadísticas generales de jugadores
CREATE VIEW view_player_stats AS
SELECT 
    p.Player_id,
    p.Player_name,
    u.Username,
    p.Blood_max,
    p.Blood_current,
    p.Level,
    p.Secrets_discovered,
    p.Achievements_unlocked,
    p.Total_playtime,
    COUNT(DISTINCT r.Run_id) AS total_runs,
    SUM(CASE WHEN r.Completed = TRUE THEN 1 ELSE 0 END) AS completed_runs,
    COUNT(DISTINCT c.Combat_id) AS total_combats,
    SUM(CASE WHEN c.Result = 'player_win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN c.Result = 'enemy_win' THEN 1 ELSE 0 END) AS losses
FROM Player p
JOIN Users u ON p.User_id = u.User_id
LEFT JOIN Run r ON p.Player_id = r.Player_id
LEFT JOIN Combat c ON p.Player_id = c.Player_id
GROUP BY p.Player_id, p.Player_name, u.Username, p.Blood_max, p.Blood_current, 
         p.Level, p.Secrets_discovered, p.Achievements_unlocked, p.Total_playtime;

-- Vista 2: Ranking de jugadores por winrate
CREATE VIEW view_player_ranking AS
SELECT 
    p.Player_id,
    p.Player_name,
    COUNT(c.Combat_id) AS total_combats,
    SUM(CASE WHEN c.Result = 'player_win' THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN c.Result = 'enemy_win' THEN 1 ELSE 0 END) AS losses,
    ROUND(
        (SUM(CASE WHEN c.Result = 'player_win' THEN 1 ELSE 0 END) * 100.0) / 
        NULLIF(COUNT(c.Combat_id), 0), 
        2
    ) AS winrate_percentage
FROM Player p
LEFT JOIN Combat c ON p.Player_id = c.Player_id
GROUP BY p.Player_id, p.Player_name
HAVING total_combats > 0
ORDER BY winrate_percentage DESC, total_combats DESC;

-- Vista 3: Cartas más usadas en combate
CREATE VIEW view_most_used_cards AS
SELECT 
    ca.Card_name,
    COUNT(cca.Action_id) AS times_used,
    SUM(cca.Damage_dealt) AS total_damage_dealt,
    AVG(cca.Damage_dealt) AS avg_damage,
    SUM(CASE WHEN cca.Card_dead = TRUE THEN 1 ELSE 0 END) AS times_destroyed,
    SUM(cca.Blood_spent) AS total_blood_spent
FROM Combat_Cards_Actions cca
JOIN Cards ca ON cca.Card_id = ca.Card_id
GROUP BY ca.Card_id, ca.Card_name
ORDER BY times_used DESC;

-- Vista 4: Estadísticas por nivel
CREATE VIEW view_level_stats AS
SELECT 
    l.Level_id,
    l.Level_name,
    l.Level_number,
    l.Enemy_name,
    COUNT(DISTINCT r.Run_id) AS total_attempts,
    SUM(CASE WHEN r.Completed = TRUE THEN 1 ELSE 0 END) AS completed_attempts,
    ROUND(
        (SUM(CASE WHEN r.Completed = TRUE THEN 1 ELSE 0 END) * 100.0) / 
        NULLIF(COUNT(r.Run_id), 0), 
        2
    ) AS completion_rate,
    AVG(r.Time_taken) AS avg_completion_time,
    MIN(r.Time_taken) AS fastest_time,
    AVG(r.Blood_recovered) AS avg_blood_recovered,
    AVG(r.Cards_found) AS avg_cards_found
FROM Levels l
LEFT JOIN Run r ON l.Level_id = r.Level_id
GROUP BY l.Level_id, l.Level_name, l.Level_number, l.Enemy_name
ORDER BY l.Level_number;

-- Vista 5: Inventario de cartas por jugador
CREATE VIEW view_player_inventory AS
SELECT 
    p.Player_id,
    p.Player_name,
    c.Card_id,
    c.Card_name,
    c.Blood_cost,
    c.Damage,
    c.HP,
    d.Card_gained,
    d.Created_at AS acquired_date
FROM Player p
JOIN Deck d ON p.Player_id = d.Player_id
JOIN Cards c ON d.Card_id = c.Card_id
ORDER BY p.Player_id, d.Created_at DESC;

-- Vista 6: Detalles completos de combates
CREATE VIEW view_combat_details AS
SELECT 
    c.Combat_id,
    p.Player_name,
    e.Enemy_name,
    l.Level_name,
    c.Result,
    c.Blood_used,
    c.Player_card_to_defeat,
    c.Enemy_card_to_defeat,
    c.Total_turns,
    c.Player_KO,
    c.Enemy_KO,
    c.Started_at,
    c.Ended_at,
    TIMESTAMPDIFF(SECOND, c.Started_at, c.Ended_at) AS duration_seconds
FROM Combat c
JOIN Player p ON c.Player_id = p.Player_id
JOIN Enemy e ON c.Enemy_id = e.Enemy_id
JOIN Levels l ON c.Level_id = l.Level_id
ORDER BY c.Combat_id DESC;

-- Vista 7: Cofres disponibles por laberinto
CREATE VIEW view_labyrinth_chests AS
SELECT 
    l.Level_id,
    lev.Level_name,
    ch.Chest_id,
    ch.Blood_amount,
    ch.Position_x,
    ch.Position_y,
    c.Card_name AS card_reward,
    s.Secret_name,
    COUNT(pco.Player_chest_id) AS times_opened
FROM Labyrinth l
JOIN Levels lev ON l.Level_id = lev.Level_id
JOIN Chest ch ON l.Labyrinth_id = ch.Labyrinth_id
LEFT JOIN Chest_card cc ON ch.Chest_id = cc.Chest_id
LEFT JOIN Cards c ON cc.Card_id = c.Card_id
LEFT JOIN Secrets s ON ch.Secret_id = s.Secret_id
LEFT JOIN Player_Chest_Opened pco ON ch.Chest_id = pco.Chest_id
GROUP BY l.Level_id, lev.Level_name, ch.Chest_id, ch.Blood_amount, 
         ch.Position_x, ch.Position_y, c.Card_name, s.Secret_name
ORDER BY l.Level_id, ch.Chest_id;

-- Vista 8: Mazos de enemigos
CREATE VIEW view_enemy_decks AS
SELECT 
    e.Enemy_id,
    e.Enemy_name,
    l.Level_name,
    e.Blood_pool,
    c.Card_id,
    c.Card_name,
    c.Blood_cost,
    c.Damage,
    c.HP
FROM Enemy e
JOIN Levels l ON e.Level_id = l.Level_id
JOIN Enemy_Cards ec ON e.Enemy_id = ec.Enemy_id
JOIN Cards c ON ec.Card_id = c.Card_id
ORDER BY e.Enemy_id, c.Card_name;

-- Vista 9: Progreso de jugadores por nivel
CREATE VIEW view_player_progress AS
SELECT 
    p.Player_id,
    p.Player_name,
    p.Level AS current_level,
    p.School_unlocked,
    p.Hospital_unlocked,
    p.Laboratory_unlocked,
    COUNT(DISTINCT r.Level_id) AS levels_attempted,
    MAX(CASE WHEN r.Completed = TRUE THEN l.Level_number ELSE 0 END) AS highest_level_completed,
    SUM(CASE WHEN r.Completed = TRUE THEN 1 ELSE 0 END) AS total_levels_completed
FROM Player p
LEFT JOIN Run r ON p.Player_id = r.Player_id
LEFT JOIN Levels l ON r.Level_id = l.Level_id
GROUP BY p.Player_id, p.Player_name, p.Level, 
         p.School_unlocked, p.Hospital_unlocked, p.Laboratory_unlocked;

-- Vista 10: Resumen de actividad reciente
CREATE VIEW view_recent_activity AS
SELECT 
    'Combat' AS activity_type,
    c.Combat_id AS activity_id,
    p.Player_name,
    CONCAT('Combate vs ', e.Enemy_name, ' - ', c.Result) AS description,
    c.Started_at AS activity_date
FROM Combat c
JOIN Player p ON c.Player_id = p.Player_id
JOIN Enemy e ON c.Enemy_id = e.Enemy_id

UNION ALL

SELECT 
    'Run' AS activity_type,
    r.Run_id AS activity_id,
    p.Player_name,
    CONCAT('Run en ', l.Level_name, ' - ', 
           CASE WHEN r.Completed THEN 'Completado' ELSE 'Fallido' END) AS description,
    r.Started_at AS activity_date
FROM Run r
JOIN Player p ON r.Player_id = r.Player_id
JOIN Levels l ON r.Level_id = l.Level_id

ORDER BY activity_date DESC
LIMIT 50;

-- Triggers

-- Trigger 1: Actualizar Last_login cuando un jugador crea o actualiza su sesión
DELIMITER $$
CREATE TRIGGER trg_update_last_login
AFTER INSERT ON Player
FOR EACH ROW
BEGIN
    UPDATE Users 
    SET Last_login = CURRENT_TIMESTAMP 
    WHERE User_id = NEW.User_id;
END$$
DELIMITER ;

-- Trigger 2: Validar que Blood_current no exceda Blood_max en Player
DELIMITER $$
CREATE TRIGGER trg_validate_player_blood_before_update
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
DELIMITER ;

-- Trigger 3: Actualizar tiempo de juego cuando termina un combate
DELIMITER $$
CREATE TRIGGER trg_update_playtime_on_combat_end
AFTER UPDATE ON Combat
FOR EACH ROW
BEGIN
    DECLARE combat_duration INT;
    
    IF NEW.Ended_at IS NOT NULL AND OLD.Ended_at IS NULL THEN
        -- Calcular duración del combate en segundos
        SET combat_duration = TIMESTAMPDIFF(SECOND, NEW.Started_at, NEW.Ended_at);
        
        -- Agregar al tiempo total de juego
        UPDATE Player 
        SET Total_playtime = Total_playtime + combat_duration 
        WHERE Player_id = NEW.Player_id;
    END IF;
END$$
DELIMITER ;
 
-- Trigger 4
-- Este triger anade las 3 cartas mas baratas al deck del jugador al crear un nuevo jugador.
DELIMITER $$
 
CREATE TRIGGER trg_starting_deck
AFTER INSERT ON Player
FOR EACH ROW
BEGIN
 
    INSERT INTO Deck (Card_id, Player_id, Run_id, Card_gained)
    SELECT c.Card_id, NEW.Player_id, NULL, FALSE
    FROM Cards c
    ORDER BY c.Blood_cost ASC, c.Card_id ASC
    LIMIT 3;
END$$
 
-- Call trg_starting_deck;
 
-- Trigger 5
-- Este trigger registra las acciones de un combate,suma sangre usada, suma KOs ,actualiza vidas restantes ,si alguien llega a 3 KOs, cierra el combate
 
 
CREATE TRIGGER trg_update_combat_after_turn
 
AFTER INSERT ON Combat_Cards_Actions
FOR EACH ROW
BEGIN
    DECLARE v_player_ko INT DEFAULT 0;
    DECLARE v_enemy_ko INT DEFAULT 0;
 
    -- la sangre
    UPDATE Combat
    SET Blood_used = Blood_used + NEW.Blood_spent
    WHERE Combat_id = NEW.Combat_id;
 
    -- sumar sangre usada al turno
    UPDATE Combat_Turns
    SET Blood_spent = Blood_spent + NEW.Blood_spent
    WHERE Turn_id = NEW.Turn_id;
 
    -- si murió una carta, sumar KO según quién la usó
    IF NEW.Card_dead = TRUE THEN
        IF NEW.Used_by = 'Player' THEN
            UPDATE Combat
            SET Player_KO = Player_KO + 1
            WHERE Combat_id = NEW.Combat_id;
        ELSEIF NEW.Used_by = 'Enemy' THEN
            UPDATE Combat
            SET Enemy_KO = Enemy_KO + 1
            WHERE Combat_id = NEW.Combat_id;
        END IF;
    END IF;
 
    -- recalcular vidas visuales
    UPDATE Combat
    SET Player_card_to_defeat = GREATEST(0, 3 - Player_KO),
        Enemy_card_to_defeat  = GREATEST(0, 3 - Enemy_KO)
    WHERE Combat_id = NEW.Combat_id;
 
    -- leer valores actuales
    SELECT Player_KO, Enemy_KO
      INTO v_player_ko, v_enemy_ko
    FROM Combat
    WHERE Combat_id = NEW.Combat_id;
 
    -- aqui esta el contador de los KO, si 3 = fin
    IF v_enemy_ko >= 3 THEN
        UPDATE Combat
        SET Result = 'player_win',
            Ended_at = COALESCE(Ended_at, NOW())
        WHERE Combat_id = NEW.Combat_id
          AND Result IS NULL;
    ELSEIF v_player_ko >= 3 THEN
        UPDATE Combat
        SET Result = 'enemy_win',
            Ended_at = COALESCE(Ended_at, NOW())
        WHERE Combat_id = NEW.Combat_id
          AND Result IS NULL;
    END IF;
END$$
-- CALL trg_update_combat_after_turn;
 
 
-- Trigger 6 COMMENT
-- Este trigger desbloquea el siguiente nivel al completar el nivel anterior
 
DELIMITER $$
 
CREATE TRIGGER trg_unlock_levels
AFTER UPDATE ON Run
FOR EACH ROW
BEGIN
   
    IF OLD.Completed = FALSE AND NEW.Completed = TRUE THEN
        -- de tutrorial a escuela
        IF NEW.Level_id = 1 THEN
            UPDATE Player
            SET Escuela_unlocked = TRUE
            WHERE Player_id = NEW.Player_id;
   
        -- De escuela a hopspital
        ELSEIF NEW.Level_id = 2 THEN
            UPDATE Player
            SET Hospital_unlocked = TRUE
            WHERE Player_id = NEW.Player_id;
 
        -- Hospital a laboratorio
        ELSEIF NEW.Level_id = 3 THEN
            UPDATE Player
            SET Laboratorio_unlocked = TRUE
            WHERE Player_id = NEW.Player_id;
        END IF;
    END IF;
END$$
 
DELIMITER ;
 
 
-- Triggger 7
-- Drop todo si no completa el laberinto
DELIMITER $$
 
CREATE TRIGGER trg_labeyrinth_failure
AFTER UPDATE ON Run
FOR EACH ROW
BEGIN
   
    IF OLD.Completed = FALSE AND NEW.Completed = FALSE AND NEW.Completed_at IS NOT NULL THEN
 
        DELETE FROM Deck
        WHERE Run_id = NEW.Run_id
        AND Card_gained = TRUE;
 
        UPDATE Run
        SET Blood_recovered = 0,
            Cards_found = 0,
            Secrets_found = 0
        WHERE Run_id = NEW.Run_id;
 
    END IF;
 
END$$
 
DELIMITER ;

-- Stored Procedures

-- Procedure 1: Crear un nuevo jugador para un usuario
DELIMITER $$
CREATE PROCEDURE sp_create_player(
    IN p_user_id INT,
    IN p_player_name VARCHAR(45)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error al crear el jugador' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Crear el jugador con valores por defecto
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
        Achievements_unlocked
    ) VALUES (
        p_user_id,
        p_player_name,
        100,
        100,
        0,
        TRUE,
        FALSE,
        FALSE,
        0,
        0,
        0
    );
    
    COMMIT;
    
    SELECT 'Jugador creado exitosamente' AS success_message, 
           LAST_INSERT_ID() AS player_id;
END$$
DELIMITER ;

-- Procedure 2: Iniciar un nuevo run en un laberinto
DELIMITER $$
CREATE PROCEDURE sp_start_run(
    IN p_player_id INT,
    IN p_labyrinth_id INT,
    IN p_level_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error al iniciar el run' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Crear el nuevo run
    INSERT INTO Run (
        Player_id,
        Labyrinth_id,
        Level_id,
        Blood_recovered,
        Cards_found,
        Secrets_found,
        Completed,
        Time_taken,
        Started_at
    ) VALUES (
        p_player_id,
        p_labyrinth_id,
        p_level_id,
        0,
        0,
        0,
        FALSE,
        0,
        CURRENT_TIMESTAMP
    );
    
    COMMIT;
    
    SELECT 'Run iniciado exitosamente' AS success_message,
           LAST_INSERT_ID() AS run_id;
END$$
DELIMITER ;

-- Procedure 3: Finalizar un combate y actualizar estadísticas
DELIMITER $$
CREATE PROCEDURE sp_finish_combat(
    IN p_combat_id INT,
    IN p_result VARCHAR(45),
    IN p_blood_used SMALLINT,
    IN p_player_ko SMALLINT,
    IN p_enemy_ko SMALLINT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error al finalizar el combate' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Actualizar el combate
    UPDATE Combat
    SET Result = p_result,
        Blood_used = p_blood_used,
        Player_KO = p_player_ko,
        Enemy_KO = p_enemy_ko,
        Ended_at = CURRENT_TIMESTAMP
    WHERE Combat_id = p_combat_id;
    
    -- Si el jugador ganó, incrementar logros
    IF p_result = 'player_win' THEN
        UPDATE Player p
        JOIN Combat c ON p.Player_id = c.Player_id
        SET p.Achievements_unlocked = p.Achievements_unlocked + 1
        WHERE c.Combat_id = p_combat_id;
    END IF;
    
    COMMIT;
    
    SELECT 'Combate finalizado exitosamente' AS success_message;
END$$
DELIMITER ;

-- Procedure 4: Abrir un cofre y obtener recompensas
DELIMITER $$
CREATE PROCEDURE sp_open_chest(
    IN p_player_id INT,
    IN p_chest_id INT,
    IN p_run_id INT
)
BEGIN
    DECLARE v_blood_amount SMALLINT;
    DECLARE v_card_id INT;
    DECLARE v_secret_id INT;
    DECLARE v_already_opened INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error al abrir el cofre' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Verificar si ya fue abierto por este jugador
    SELECT COUNT(*) INTO v_already_opened
    FROM Player_Chest_Opened
    WHERE Player_id = p_player_id AND Chest_id = p_chest_id;
    
    IF v_already_opened > 0 THEN
        ROLLBACK;
        SELECT 'Este cofre ya fue abierto anteriormente' AS warning_message;
    ELSE
        -- Obtener recompensas del cofre
        SELECT Blood_amount, Secret_id INTO v_blood_amount, v_secret_id
        FROM Chest
        WHERE Chest_id = p_chest_id;
        
        -- Obtener carta del cofre si existe
        SELECT Card_id INTO v_card_id
        FROM Chest_card
        WHERE Chest_id = p_chest_id
        LIMIT 1;
        
        -- Registrar que el cofre fue abierto
        INSERT INTO Player_Chest_Opened (Player_id, Chest_id, Run_id)
        VALUES (p_player_id, p_chest_id, p_run_id);
        
        -- Agregar sangre al jugador
        UPDATE Player
        SET Blood_current = LEAST(Blood_current + v_blood_amount, Blood_max)
        WHERE Player_id = p_player_id;
        
        -- Si hay carta, agregarla al deck
        IF v_card_id IS NOT NULL THEN
            INSERT INTO Deck (Card_id, Player_id, Run_id, Card_gained)
            VALUES (v_card_id, p_player_id, p_run_id, TRUE);
        END IF;
        
        -- Si hay secreto, incrementar contador
        IF v_secret_id IS NOT NULL THEN
            UPDATE Player
            SET Secrets_discovered = Secrets_discovered + 1
            WHERE Player_id = p_player_id;
        END IF;
        
        -- Actualizar estadísticas del run
        UPDATE Run
        SET Blood_recovered = Blood_recovered + v_blood_amount,
            Cards_found = Cards_found + IF(v_card_id IS NOT NULL, 1, 0),
            Secrets_found = Secrets_found + IF(v_secret_id IS NOT NULL, 1, 0)
        WHERE Run_id = p_run_id;
        
        COMMIT;
        
        SELECT 'Cofre abierto exitosamente' AS success_message,
               v_blood_amount AS blood_gained,
               v_card_id AS card_obtained,
               v_secret_id AS secret_discovered;
    END IF;
END$$
DELIMITER ;


