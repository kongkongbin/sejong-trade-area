CREATE DATABASE IF NOT EXISTS sejong_trade_area
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sejong_trade_area;

-- ============================================
-- 1. 어드민 유저 (멀티유저)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. 인구/세대 통계 (행정동 단위, 배치 적재)
--    - 거주인구(연령x성별), 직장인구(연령x성별), 주택유형별 세대수
--      세 가지를 stat_type으로 구분해 한 테이블에서 처리
-- ============================================
CREATE TABLE IF NOT EXISTS population_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_dong_code VARCHAR(10) NOT NULL COMMENT '행정동코드',
  admin_dong_name VARCHAR(50) NOT NULL COMMENT '행정동명 (예: 범어동)',
  sigungu_name VARCHAR(50) NOT NULL COMMENT '시군구명 (예: 수성구)',
  stat_type ENUM('resident_population', 'worker_population', 'household_by_housing_type') NOT NULL,
  category VARCHAR(30) NOT NULL COMMENT '연령대(10대,20대...60대이상) 또는 주택유형(단독주택,아파트,빌라,오피스텔)',
  gender ENUM('M', 'F', 'ALL') NOT NULL DEFAULT 'ALL',
  value INT NOT NULL COMMENT '인구수 또는 세대수',
  stat_ym VARCHAR(7) NOT NULL COMMENT '기준월 YYYY-MM',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dong_stat (admin_dong_code, stat_type, stat_ym)
);

-- ============================================
-- 3. 주변시설 (학교/어린이집/병원, 배치 적재)
--    - 위경도 기준 반경검색은 ST_Distance_Sphere로 처리 (별도 spatial 컬럼 불필요, 대구 한정 데이터량이라 충분)
-- ============================================
CREATE TABLE IF NOT EXISTS facilities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('kindergarten', 'elementary', 'middle', 'high', 'university', 'hospital', 'childcare') NOT NULL,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(300),
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  extra_info JSON COMMENT '카테고리별 부가정보 (예: 병원 병상수, 어린이집 정원 등)',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_latlng (lat, lng)
);

-- ============================================
-- 4. 대중교통 (지하철/버스, 배치 적재)
-- ============================================
CREATE TABLE IF NOT EXISTS transit_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('subway', 'bus') NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '역명 또는 정류장명',
  line_name VARCHAR(50) COMMENT '지하철 호선 (버스는 NULL)',
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  daily_avg_riders INT COMMENT '일평균 승하차',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_latlng (lat, lng)
);
