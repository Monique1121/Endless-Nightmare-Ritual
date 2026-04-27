-- Limpiar cartas duplicadas en Deck
-- Mantiene solo la primera entrada de cada carta por jugador

DELETE d1 FROM Deck d1
INNER JOIN Deck d2 
WHERE d1.Deck_id > d2.Deck_id 
  AND d1.Player_id = d2.Player_id 
  AND d1.Card_id = d2.Card_id 
  AND d1.Card_gained = TRUE 
  AND d2.Card_gained = TRUE;

SELECT 'Duplicados eliminados' as status;
SELECT Player_id, Card_id, COUNT(*) as count 
FROM Deck 
WHERE Card_gained = TRUE 
GROUP BY Player_id, Card_id 
HAVING count > 1;
