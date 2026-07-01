# 세종 상권/입지 분석 (sejong-trade-area)

세종홀딩스 내부 관리자용 AI 상권/입지 분석 도구.
세종중개법인 REALTY 사이트와는 완전히 별개의 독립 프로그램.

## 구조

```
sejong-trade-area/
├── client/   React + Vite 프론트엔드
└── server/   Node.js + Express 백엔드 (MySQL, JWT 인증)
```

## 기술 스택

- 프론트: React + Vite
- 백엔드: Node.js + Express
- DB: MySQL
- 지도: Naver Maps JS SDK
- 인증: JWT (멀티유저 admin 테이블)

## 초기 세팅

### 1. 백엔드

```bash
cd server
npm install
copy .env.example .env
```

`.env` 파일 채우기 (DB 접속정보, JWT 시크릿, Naver Maps 키 등).

```bash
npm run dev
```

기본 포트: `http://localhost:4000`

### 2. DB 테이블 생성

`server/sql/schema.sql` 참고해서 MySQL에 테이블 생성.

### 3. 프론트엔드

```bash
cd client
npm install
copy .env.example .env
```

```bash
npm run dev
```

기본 포트: `http://localhost:5173`

## 다음 단계

- [ ] 분석 결과 캐싱 테이블 / 즐겨찾기 테이블 등 DB 스키마 확장
- [ ] 소상공인시장진흥공단 상가(상권)정보 API 연동
- [ ] 공공데이터포털 배치 ETL 스크립트 (인구/학교/병원/교통)
- [ ] Naver Maps 지도 + 반경 선택 UI
- [ ] 탭별 데이터 패널 (생활인구/프랜차이즈/대중교통/종합병원/보육시설/학교)
