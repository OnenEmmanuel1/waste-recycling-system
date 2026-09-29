-- Local Compose app account: no password by request, restricted to EWRAP database.
CREATE USER IF NOT EXISTS 'ewrap_app'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON `ewrap`.* TO 'ewrap_app'@'%';
