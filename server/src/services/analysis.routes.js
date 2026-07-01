const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getFranchiseAnalysis } = require('../services/store.service');
const { getPopulationAnalysis } = require('../services/population.service');

// POST /api/analysis/franchise
router.post('/franchise', requireAuth, async (req, res) => {
  const { lat, lng, radius } = req.body;
  if (!lat || !lng || !radius) {
    return res.status(400).json({ message: '좌표(lat, lng)와 반경(radius)이 필요합니다.' });
  }
  try {
    const result = await getFranchiseAnalysis(lat, lng, radius);
    res.json(result);
  } catch (err) {
    console.error('프랜차이즈 분석 오류:', err.message);
    res.status(500).json({ message: '상가정보 API 호출 중 오류가 발생했습니다.' });
  }
});

// POST /api/analysis/population
router.post('/population', requireAuth, async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ message: '좌표(lat, lng)가 필요합니다.' });
  }
  try {
    const result = await getPopulationAnalysis(lat, lng);
    if (!result) {
      return res.status(404).json({ message: '해당 위치의 행정동 정보를 찾을 수 없습니다.' });
    }
    res.json(result);
  } catch (err) {
    console.error('인구 분석 오류:', err.message);
    res.status(500).json({ message: '인구 분석 중 오류가 발생했습니다.' });
  }
});

// 나머지 탭들은 이후 단계에서 추가
// POST /api/analysis/transit     → 대중교통
// POST /api/analysis/facility    → 종합병원/보육/학교

module.exports = router;