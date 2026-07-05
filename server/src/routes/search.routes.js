const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/db');
const axios = require('axios');
require('dotenv').config();

// AI에게 자연어 질의에서 검색 조건만 뽑아내게 시키는 프롬프트
const EXTRACT_PROMPT = `사용자의 자연어 문장에서 부동산 매물 검색 조건을 추출해서 JSON으로만 응답하세요.
설명이나 다른 텍스트 없이 JSON 객체만 출력하세요.

추출할 필드:
- dong: 동/구 이름 (예: "구암동", "수성구"). 없으면 null
- minDeposit, maxDeposit: 보증금 범위 (만원 단위 숫자). "1000에" 같은 단일 값이면 min=max=그 값. 없으면 null
- minRent, maxRent: 월세 범위 (만원 단위 숫자). 없으면 null
- business: 업종 (예: "카페", "편의점"). 없으면 null
- verdict: AI 판정 필터 ("GO", "CONDITIONAL_GO", "NO_GO" 중 하나). 언급 없으면 null

예시 입력: "구암동에 있는 보증금 1000에 월세 10 매물좀 보여줘"
예시 출력: {"dong":"구암동","minDeposit":1000,"maxDeposit":1000,"minRent":10,"maxRent":10,"business":null,"verdict":null}

예시 입력: "월세 50 이하 카페 자리 있어?"
예시 출력: {"dong":null,"minDeposit":null,"maxDeposit":null,"minRent":null,"maxRent":50,"business":"카페","verdict":null}`;

async function extractFilters(message) {
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: EXTRACT_PROMPT,
      messages: [{ role: 'user', content: message }],
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const text = response.data.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('조건 추출 실패');

  return JSON.parse(jsonMatch[0]);
}

// 추출된 조건으로 DB 검색
async function searchLocations(filters) {
  const where = [];
  const params = [];

  if (filters.dong) {
    where.push('address LIKE ?');
    params.push(`%${filters.dong}%`);
  }
  if (filters.minDeposit != null) {
    where.push('deposit >= ?');
    params.push(filters.minDeposit);
  }
  if (filters.maxDeposit != null) {
    where.push('deposit <= ?');
    params.push(filters.maxDeposit);
  }
  if (filters.minRent != null) {
    where.push('monthly_rent >= ?');
    params.push(filters.minRent);
  }
  if (filters.maxRent != null) {
    where.push('monthly_rent <= ?');
    params.push(filters.maxRent);
  }
  if (filters.business) {
    where.push('target_business LIKE ?');
    params.push(`%${filters.business}%`);
  }
  if (filters.verdict) {
    where.push('ai_verdict = ?');
    params.push(filters.verdict);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT id, address, target_business, deposit, monthly_rent, premium,
            ai_verdict, ai_summary, created_at
     FROM location_data
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT 30`,
    params
  );

  return rows;
}

// POST /api/search — 자연어 매물 검색
router.post('/', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ message: '검색어를 입력해주세요.' });
  }

  try {
    const filters = await extractFilters(message);
    const results = await searchLocations(filters);
    res.json({ filters, results, count: results.length });
  } catch (err) {
    console.error('매물 검색 오류:', err.message);
    res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
  }
});

module.exports = router;