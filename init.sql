CREATE DATABASE IF NOT EXISTS curtaincall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS curtaincall_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 기존 사용자에게 권한 부여
GRANT ALL PRIVILEGES ON curtaincall.* TO 'curtaincall'@'%';
GRANT ALL PRIVILEGES ON curtaincall_test.* TO 'curtaincall'@'%';
FLUSH PRIVILEGES;
