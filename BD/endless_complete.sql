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
    Blood_max INT NOT NULL DEFAULT 100,
    Blood_current INT NOT NULL DEFAULT 100,
    Level INT NOT NULL DEFAULT 0,
    Escuela_unlocked BOOLEAN DEFAULT TRUE,  
    Hospital_unlocked BOOLEAN DEFAULT FALSE,
    Laboratorio_unlocked BOOLEAN DEFAULT FALSE,
    Secrets_discovered INT NOT NULL DEFAULT 0,
    Total_playtime INT NOT NULL DEFAULT 0,
    Achievments_unlocked INT NOT NULL DEFAULT 0,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Player_id),
    FOREIGN KEY (User_id) REFERENCES Users(User_id) ON DELETE CASCADE,
    INDEX idx_user (User_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Cards (
    Card_id INT AUTO_INCREMENT NOT NULL,
    Card_name VARCHAR(45) NOT NULL,
    Blood_cost INT NOT NULL DEFAULT 0,
    Damage INT NOT NULL DEFAULT 0,
    HP INT NOT NULL DEFAULT 1,
    Sprite_path VARCHAR(255),
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Card_id),
    INDEX idx_cost (Blood_cost)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Levels (
    Level_id INT AUTO_INCREMENT NOT NULL,
    Level_name VARCHAR(45) NOT NULL,
    Level_number INT NOT NULL,
    Enemy_name VARCHAR(45) NOT NULL,
    Time_limit INT NOT NULL DEFAULT 60,
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Level_id),
    INDEX idx_level_number (Level_number)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Labyrinth (
    Labyrinth_id INT AUTO_INCREMENT NOT NULL,
    Level_id INT NOT NULL,
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
    Blood_recovered INT NOT NULL DEFAULT 0,
    Cards_found INT NOT NULL DEFAULT 0,
    Secrets_found INT NOT NULL DEFAULT 0,
    Completed BOOLEAN NOT NULL DEFAULT FALSE,
    Time_taken INT NOT NULL DEFAULT 0,
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
    Blood_current INT NOT NULL,
    Level_checkpoint INT NOT NULL,
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
    Blood_pool INT NOT NULL DEFAULT 50,
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
    Blood_amount INT NOT NULL DEFAULT 0,
    Position_x INT NOT NULL,
    Position_y INT NOT NULL,
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
    Player_lives INT NOT NULL DEFAULT 3,
    Enemy_lives INT NOT NULL DEFAULT 3,
    Total_turns INT NOT NULL DEFAULT 0,
    Player_KO INT NOT NULL DEFAULT 0,
    Enemy_KO INT NOT NULL DEFAULT 0,
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
    Turn_number INT NOT NULL,
    Active_player VARCHAR(10),
    Blood_spent INT DEFAULT 0,
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
    Blood_spent INT NOT NULL DEFAULT 0,
    Damage_dealt INT NOT NULL DEFAULT 0,
    HP_before INT NOT NULL,
    HP_after INT NOT NULL,
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

INSERT INTO Cards (Card_name, Blood_cost, Damage, HP) VALUES
('Sombra Voraz', 1, 3, 3),
('Imán Llamas', 2, 4, 4),
('Látigo Umbral', 1, 2, 2),
('Guardia Abisal', 3, 5, 6),
('Bendición', 2, 1, 5),
('Furia Carmesí', 4, 7, 5),
('Eco Vacío', 2, 3, 3),
('Tormentador', 3, 6, 4),
('Pesadilla', 1, 2, 3),
('Asesino', 2, 4, 3);

INSERT INTO Levels (Level_name, Level_number, Enemy_name, Time_limit) VALUES
('Tutorial', 0, 'Sombra Entrenamiento', 120),
('Escuela', 1, 'Director Corrupto', 60),
('Hospital', 2, 'Doctor Despiadado', 90),
('Laboratorio', 3, 'El Científico Loco', 105);

INSERT INTO Secrets (Secret_name, Content) VALUES
('El Primer Ritual', 'Todo comenzó con un experimento fallido en el sótano del hospital...'),
('Verdad Oculta', 'Los doctores sabían lo que hacían. Todos lo sabían.'),
('Salida Secreta', 'No la verdad no sé que más poner aqui mi cerebro esta muerto');
