BEGIN TRANSACTION

UPDATE Product
SET quantity = quantity - 1
WHERE product_id = 'itemID’';

IF quantity = -1 
THEN
   ROLLBACK TRANSACTION;
ELSE
   COMMIT TRANSACTION;
END IF;
