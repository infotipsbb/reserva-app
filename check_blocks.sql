-- Verificar bloqueos existentes y su formato
SELECT 
  id, 
  court_id, 
  start_date, 
  end_date, 
  reason,
  TO_CHAR(start_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as start_iso,
  TO_CHAR(end_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as end_iso
FROM availability_blocks 
ORDER BY start_date DESC;
