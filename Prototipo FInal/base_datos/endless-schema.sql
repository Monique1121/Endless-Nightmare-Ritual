-- ============================================
-- ENDLESS NIGHTMARE RITUAL - DATABASE SCHEMA
-- ============================================
-- Base de datos completa para el juego
-- Incluye: Usuarios, Jugadores, Cartas, Laberintos, Combates, Secretos
-- ============================================

DROP DATABASE IF EXISTS endless;
CREATE DATABASE endless;
USE endless;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Tabla de usuarios (login)
CREATE TABLE Users (
    User_id INT AUTO_INCREMENT NOT NULL,
    Username VARCHAR(45) NOT NULL UNIQUE,
    Password_user VARCHAR(255) NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_login TIMESTAMP NULL,
    Is_active BOOLEAN DEFAULT TRUE,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (User_id),
    INDEX idx_username (Username)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- Tabla de jugadores (perfiles de juego)
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

-- Tabla de cartas
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

-- Tabla de niveles
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

-- Tabla de laberintos
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

-- ============================================
-- SISTEMA DE RUNS (PARTIDAS)
-- ============================================

-- Tabla de runs (intentos de completar laberinto)
CREATE TABLE Run (
    Run_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Labyrinth_id INT NOT NULL,
    Level_id INT NOT NULL,
    Blood_recovered SMALLINT NOT NULL DEFAULT 0,
    Cards_found SMALLINT NOT NULL DEFAULT 0,
    Secrets_found SMALLINT NOT NULL DEFAULT 0,
    Completed BOOLEAN NULL,
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

-- Tabla de checkpoints durante un run
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

-- ============================================
-- SISTEMA DE CARTAS DEL JUGADOR
-- ============================================

-- Tabla del deck del jugador (cartas obtenidas)
-- Card_gained: TRUE = permanente (guardada), FALSE = temporal (en riesgo)
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
    INDEX idx_player (Player_id),
    INDEX idx_gained (Card_gained)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SISTEMA DE ENEMIGOS
-- ============================================

-- Tabla de enemigos
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

-- Tabla de cartas de enemigos
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

-- ============================================
-- SISTEMA DE SECRETOS
-- ============================================

-- Tabla de secretos (lore del juego)
CREATE TABLE Secrets (
    Secret_id INT AUTO_INCREMENT NOT NULL,
    Secret_name VARCHAR(100) NOT NULL,
    Content TEXT NOT NULL,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Secret_id)
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Player_Secrets (
    Player_secret_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Secret_id INT NOT NULL,
    Discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Player_secret_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Secret_id) REFERENCES Secrets(Secret_id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_secret (Player_id, Secret_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- SISTEMA DE COFRES
-- ============================================

-- Tabla de cofres en laberintos
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

-- Tabla de cartas en cofres
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

-- Tabla de cofres abiertos por jugadores
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

-- ============================================
-- SISTEMA DE ITEMS
-- ============================================

-- Tabla de items especiales del jugador
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

-- ============================================
-- SISTEMA DE COMBATE (TCG)
-- ============================================

-- Tabla de combates
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

-- Tabla de turnos de combate
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

-- Tabla de acciones de cartas en combate
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

-- Tabla de logs de combate
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Actualizar Last_login cuando un jugador inicia sesión
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

-- Validar que Blood_current no exceda Blood_max
DELIMITER $$
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
DELIMITER ;

-- Actualizar tiempo de juego cuando termina un combate
DELIMITER $$
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

