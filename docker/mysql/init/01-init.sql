-- Grant all privileges to kanban_user
GRANT ALL PRIVILEGES ON kanban_clone.* TO 'kanban_user'@'%';
FLUSH PRIVILEGES;

-- Set timezone
SET GLOBAL time_zone = '+07:00';
