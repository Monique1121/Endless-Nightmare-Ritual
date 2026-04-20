-- ============================================================================
-- EXTENSIÓN BD: Sistema de Cofres Abiertos y Máscara de Luz
-- ============================================================================
USE endless;

-- ============================================================================
-- TABLA: Player_Chest_Opened
-- Rastrea qué cofres ha abierto cada jugador
-- ============================================================================
CREATE TABLE IF NOT EXISTS Player_Chest_Opened (
    Player_chest_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Chest_id INT NOT NULL,
    Run_id INT NULL, -- En qué run se abrió (NULL si es permanente)
    Opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (Player_chest_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id) ON DELETE CASCADE,
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id) ON DELETE SET NULL,
    UNIQUE KEY unique_player_chest (Player_id, Chest_id),
    INDEX idx_player (Player_id),
    INDEX idx_chest (Chest_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- TABLA: Player_Items
-- Items especiales que el jugador puede obtener (como la Máscara de Luz)
-- ============================================================================
CREATE TABLE IF NOT EXISTS Player_Items (
    Player_item_id INT AUTO_INCREMENT NOT NULL,
    Player_id INT NOT NULL,
    Item_name VARCHAR(50) NOT NULL, -- Ej: 'mascara_luz', 'llave_oro', etc.
    Obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Is_active BOOLEAN DEFAULT TRUE,
    
    PRIMARY KEY (Player_item_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_item (Player_id, Item_name),
    INDEX idx_player (Player_id)
    
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4;

-- NOTA: Ejecuta este script después de endless_corregida.sql
-- Comando: SOURCE cofres_y_mascara.sql; o importarlo desde MySQL Workbench
