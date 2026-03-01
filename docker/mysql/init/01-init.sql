-- Grant all privileges to trello_user
GRANT ALL PRIVILEGES ON trello_clone.* TO 'trello_user'@'%';
FLUSH PRIVILEGES;

-- Set timezone
SET GLOBAL time_zone = '+07:00';
