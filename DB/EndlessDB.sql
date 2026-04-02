USE endless;

CREATE TABLE Player (
    Player_id int NOT NULL,
    Player_name char(45) NOT NULL,
    Blood_max int NOT NULL DEFAULT 100,
    Blood_current int NOT NULL,
    
    PRIMARY KEY (Player_id)
);

CREATE TABLE Cards (
    Card_id int NOT NULL,
    Card_name char(45) NOT NULL,
    Card_type char(45),
    Blood_cost int NOT NULL,
    Damage int NOT NULL,
    Description TEXT,
    Card_tier char(45) NOT NULL,
    HP int NOT NULL, 
    
    PRIMARY KEY (Card_id)
);

CREATE TABLE Levels (
    Level_id int NOT NULL,
    Level_name char(45) NOT NULL,
    
    PRIMARY KEY (Level_id)
);

CREATE TABLE Labyrinth (
    Labyrinth_id int NOT NULL,
    Level_id int NOT NULL,
    Seed int NOT NULL,
    
    PRIMARY KEY (Labyrinth_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Run (
    Run_id int NOT NULL,
    Player_id int NOT NULL,
    Labyrinth_id int NOT NULL,
    Level_id int NOT NULL,
    Blood_recovered int NOT NULL,
    Cards_found int NOT NULL,
    Secrets_found int NOT NULL,
    Completed BOOL NOT NULL,
    Time_taken int NOT NULL,
    
    PRIMARY KEY (Run_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Deck (
	Deck_id int NOT NULL,
    Card_id int NOT NULL,
    Player_id int NOT NULL,
    Run_id int NOT NULL,
    Card_gained bool NOT NULL,
    
    PRIMARY KEY (Deck_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id)
);



CREATE TABLE Enemy (
    Enemy_id int NOT NULL,
    Level_id int NOT NULL,
    Enemy_name char(45) NOT NULL,
    Blood_pool int NOT NULL,
    
    PRIMARY KEY (Enemy_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Enemy_Cards (
    Enemy_id int NOT NULL,
    Card_id int NOT NULL,
    
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

CREATE TABLE Chest (
    Chest_id int NOT NULL,
    Labyrinth_id int NOT NULL,
    Blood_amount int NOT NULL,
    Position_x int NOT NULL,
    Position_y int NOT NULL,
    
    PRIMARY KEY (Chest_id),
    FOREIGN KEY (Labyrinth_id) REFERENCES Labyrinth(Labyrinth_id)
);

CREATE TABLE Secrets (
    Secret_id int NOT NULL,
    Content TEXT NOT NULL,
    
    PRIMARY KEY (Secret_id)
);

CREATE TABLE Chest_card (
    Chest_id int NOT NULL,
    Card_id int NOT NULL,
    Picked_up BOOL NOT NULL DEFAULT FALSE, 
    
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);

CREATE TABLE Chest_secrets (
    Chest_id int NOT NULL,
    Secret_id int NOT NULL,
    Picked_up BOOL NOT NULL DEFAULT FALSE, 
    
    FOREIGN KEY (Chest_id) REFERENCES Chest(Chest_id),
    FOREIGN KEY (Secret_id) REFERENCES Secrets(Secret_id)
);

CREATE TABLE Combat (
    Combat_id int NOT NULL,
    Player_id int NOT NULL,
    Enemy_id int NOT NULL,
    Run_id int NOT NULL,
    Level_id int NOT NULL,
    Result char(45) NOT NULL,
    Blood_used int NOT NULL,
    Player_lives int NOT NULL default 3,
    Enemy_lives int NOT NULL default 3,
    
    PRIMARY KEY (Combat_id),
    FOREIGN KEY (Player_id) REFERENCES Player(Player_id),
    FOREIGN KEY (Enemy_id) REFERENCES Enemy(Enemy_id),
    FOREIGN KEY (Run_id) REFERENCES Run(Run_id),
    FOREIGN KEY (Level_id) REFERENCES Levels(Level_id)
);

CREATE TABLE Combat_Cards (
    Combat_id INT NOT NULL,
    Card_id INT NOT NULL,
    Used_by CHAR(45) NOT NULL,
    Blood_spent INT NOT NULL,
    Damage_dealt INT NOT NULL,
    Turn_number INT NOT NULL,
    HP_before int NOT NULL, 
    HP_after int NOT NULL, 
    Card_dead bool NOT NULL, 
    
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);


CREATE TABLE Combat_hand (
	Combat_id int NOT NULL,
    Card_id int NOT NULL, 
    
    FOREIGN KEY (Combat_id) REFERENCES Combat(Combat_id),
    FOREIGN KEY (Card_id) REFERENCES Cards(Card_id)
);







