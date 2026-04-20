DROP DATABASE IF EXISTS manga_cafe;
CREATE DATABASE manga_cafe;
USE manga_cafe;

CREATE TABLE mangas (
    manga_id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(100),
    autor VARCHAR(100),
    anio VARCHAR(20),
    genero VARCHAR(50),
    sinopsis TEXT,
    imagen VARCHAR(255)
);

CREATE TABLE menu (
    menu_id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(50),
    nombre_item VARCHAR(100),
    imagen VARCHAR(255)
);

INSERT INTO mangas (titulo, autor, anio, genero, sinopsis, imagen) VALUES
('Kimetsu no Yaiba (Demon Slayer)', 'Koyoharu Gotōge', '2016-2020', 'Shōnen, Acción, Terror, Aventura', 'En el Japón de la Era Taisho, Tanjiro Kamado regresa a casa y encuentra a su familia masacrada. Su hermana Nezuko es la única sobreviviente, pero ha sido convertida en demonio. Decidido a devolverle su humanidad, Tanjiro se convierte en cazador de demonios y emprende un largo viaje lleno de peligros.', 'demon_slayer.jpg'),
('Jujutsu Kaisen', 'Gege Akutami', '2018-2024', 'Acción, Sobrenatural, Fantasía oscura, Shōnen', 'Yuji Itadori es un estudiante con habilidades físicas extraordinarias. Cuando ingiere el dedo de una poderosa maldición llamada Ryomen Sukuna, queda atrapado en el mundo de los hechiceros jujutsu y las maldiciones sobrenaturales que amenazan a la humanidad.', 'itadori.jpg'),
('Yarichin☆Bitch Club', 'Ogeretsu Tanaka', '2012-presente', 'Comedia, Romance, Yaoi/BL', 'Takashi Tōno es transferido a la Academia Morimori, una escuela exclusivamente masculina en las montañas. Al unirse al club de fotografía creyendo que es tranquilo, descubre que sus miembros forman el llamado Yarichin Bitch Club.', 'yarichin.jpg'),
('Hirunaka No Ryuusei', 'Mika Yamamori', '2011-2014', 'Shōjo, Romance, Comedia, Vida escolar', 'Suzume Yosano, una chica de 15 años del campo, se ve obligada a mudarse a Tokio para vivir con su tío. Al llegar, se pierde y es ayudada por un joven que al día siguiente resulta ser su nuevo profesor de Historia. Entre nuevas amistades y sentimientos que no puede controlar, descubrirá que el primer amor puede ser tan fugaz como una estrella fugaz diurna.', 'hirunaka.jpg'),
('Another', 'Yukito Ayatsuji', '2010-2012', 'Seinen, Horror, Misterio', 'En 1972, un popular estudiante de la clase 3-3 murió y sus compañeros actuaron como si siguiera vivo. Décadas después, Koichi Sakakibara llega a esa misma clase y conoce a la enigmática Mei Misaki, ignorada por todos. Una maldición mortal los acecha.', 'another.jpg'),
('Kamisama Hajimemashita (Kamisama Kiss)', 'Julietta Suzuki', '2008-2016', 'Shōjo, Romance, Sobrenatural', 'Nanami Momozono queda sin hogar cuando su padre huye por sus deudas. Al ayudar a un extraño llamado Mikage, él le cede su casa como agradecimiento, pero resulta ser un templo sintoísta. Nanami es declarada la nueva deidad local y debe aprender sus deberes junto a Tomoe, un demonio zorro reacio.', 'kamisama.jpg');

INSERT INTO menu (day, nombre_item, imagen) VALUES
('Lunes', 'Sushi', 'sushi.jpg'),
('Lunes', 'Ramen', 'ramen.jpg'),
('Lunes', 'Tempura', 'tempura.jpg'),
('Martes', 'Onigiri', 'onigiri.jpg'),
('Martes', 'Tonkatsu', 'tonkatsu.jpg'),
('Martes', 'Miso Soup', 'miso.jpg'),
('Miércoles', 'Yakitori', 'yakitori.jpg'),
('Miércoles', 'Gyoza', 'gyoza.jpg'),
('Miércoles', 'Udon', 'udon.jpg'),
('Jueves', 'Sashimi', 'sashimi.jpg'),
('Jueves', 'Takoyaki', 'takoyaki.jpg'),
('Jueves', 'Okonomiyaki', 'okonomiyaki.jpg'),
('Viernes', 'Chirashi', 'chirashi.jpg'),
('Viernes', 'Karaage', 'karaage.jpg'),
('Viernes', 'Ramen Spicy', 'spicy.jpg'),
('Sábado', 'Unagi', 'unagi.jpg'),
('Sábado', 'Shabu Shabu', 'shabu.jpg'),
('Sábado', 'Mochi', 'mochi.jpg'),
('Domingo', 'Katsudon', 'katsudon.jpg'),
('Domingo', 'Tamago Sushi', 'tamago.jpg'),
('Domingo', 'Yakisoba', 'yakisoba.jpg');

SELECT * FROM menu;



