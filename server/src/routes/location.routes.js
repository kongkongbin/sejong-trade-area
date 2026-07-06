const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/db');
const { generateAIOpinion } = require('../services/ai.service');

// GET /api/locations — 전체 목록
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, address, lat, lng, target_business, ai_verdict, created_at
       FROM location_data
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '목록 조회 실패' });
  }
});

// GET /api/locations/nearby-average — 반경 내 기존 매물들의 가시성/접근성/공실률 평균
// (※ /:id 라우트보다 반드시 먼저 선언되어야 함 — 안 그러면 'nearby-average'가 id로 오인됨)
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/nearby-average', requireAuth, async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius) || 500;
  const excludeId = req.query.excludeId ? Number(req.query.excludeId) : null;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat, lng가 필요합니다.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, lat, lng, visibility_score, accessibility_score, nearby_vacancy_rate
       FROM location_data
       WHERE lat IS NOT NULL AND lng IS NOT NULL`
    );

    const nearby = rows.filter((r) => {
      if (excludeId && r.id === excludeId) return false;
      return haversineMeters(lat, lng, Number(r.lat), Number(r.lng)) <= radius;
    });

    if (!nearby.length) {
      return res.json({ count: 0 });
    }

    const avg = (key) =>
      nearby.reduce((sum, r) => sum + Number(r[key] || 0), 0) / nearby.length;

    res.json({
      count: nearby.length,
      avgVisibility: Math.round(avg('visibility_score') * 10) / 10,
      avgAccessibility: Math.round(avg('accessibility_score') * 10) / 10,
      avgVacancyRate: Math.round(avg('nearby_vacancy_rate')),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '평균 조회 실패' });
  }
});

// GET /api/locations/:id — 단일 조회
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM location_data WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: '데이터를 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '조회 실패' });
  }
});

// POST /api/locations — 저장
router.post('/', requireAuth, async (req, res) => {
  const data = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO location_data (
        address, lat, lng, analysis_radius,
        premium, deposit, monthly_rent, interior_budget, other_initial_cost,
        target_business, avg_price_per_customer, expected_daily_sales, business_hours,
        visibility_score, accessibility_score, parking_available,
        building_age, has_elevator, is_corner, floor_info, area_pyeong,
        nearby_vacancy_rate, redevelopment_plan, redevelopment_note,
        landlord_note, field_memo,
        contract_period, landlord_asking_rent, desired_rent,
        created_by
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.address, data.lat, data.lng, data.analysis_radius || 500,
        data.premium || 0, data.deposit || 0, data.monthly_rent || 0,
        data.interior_budget || 0, data.other_initial_cost || 0,
        data.target_business || '', data.avg_price_per_customer || 0,
        data.expected_daily_sales || 0, data.business_hours || '',
        data.visibility_score || 3, data.accessibility_score || 3,
        data.parking_available ? 1 : 0,
        data.building_age || null, data.has_elevator ? 1 : 0,
        data.is_corner ? 1 : 0, data.floor_info || '', data.area_pyeong || null,
        data.nearby_vacancy_rate || 0, data.redevelopment_plan ? 1 : 0,
        data.redevelopment_note || '', data.landlord_note || '',
        data.field_memo || '',
        data.contract_period || '', data.landlord_asking_rent || 0,
        data.desired_rent || 0,
        req.user.id,
      ]
    );
    res.status(201).json({ id: result.insertId, message: '저장되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '저장 실패' });
  }
});

// PUT /api/locations/:id — 수정
router.put('/:id', requireAuth, async (req, res) => {
  const data = req.body;
  try {
    await pool.query(
      `UPDATE location_data SET
        address=?, lat=?, lng=?, analysis_radius=?,
        premium=?, deposit=?, monthly_rent=?, interior_budget=?, other_initial_cost=?,
        target_business=?, avg_price_per_customer=?, expected_daily_sales=?, business_hours=?,
        visibility_score=?, accessibility_score=?, parking_available=?,
        building_age=?, has_elevator=?, is_corner=?, floor_info=?, area_pyeong=?,
        nearby_vacancy_rate=?, redevelopment_plan=?, redevelopment_note=?,
        landlord_note=?, field_memo=?,
        contract_period=?, landlord_asking_rent=?, desired_rent=?
       WHERE id=?`,
      [
        data.address, data.lat, data.lng, data.analysis_radius || 500,
        data.premium || 0, data.deposit || 0, data.monthly_rent || 0,
        data.interior_budget || 0, data.other_initial_cost || 0,
        data.target_business || '', data.avg_price_per_customer || 0,
        data.expected_daily_sales || 0, data.business_hours || '',
        data.visibility_score || 3, data.accessibility_score || 3,
        data.parking_available ? 1 : 0,
        data.building_age || null, data.has_elevator ? 1 : 0,
        data.is_corner ? 1 : 0, data.floor_info || '', data.area_pyeong || null,
        data.nearby_vacancy_rate || 0, data.redevelopment_plan ? 1 : 0,
        data.redevelopment_note || '', data.landlord_note || '',
        data.field_memo || '',
        data.contract_period || '', data.landlord_asking_rent || 0,
        data.desired_rent || 0,
        req.params.id,
      ]
    );
    res.json({ message: '수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '수정 실패' });
  }
});

// DELETE /api/locations/:id — 삭제
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM location_data WHERE id = ?', [req.params.id]);
    res.json({ message: '삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '삭제 실패' });
  }
});

// POST /api/locations/:id/generate-ai — AI 의견 생성
router.post('/:id/generate-ai', requireAuth, async (req, res) => {
  const { analysisData } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM location_data WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: '데이터를 찾을 수 없습니다.' });

    const locationData = rows[0];
    const result = await generateAIOpinion({ locationData, analysisData });

    // 구조화된 데이터 DB 저장
    await pool.query(
      `UPDATE location_data SET
        ai_opinion=?, ai_verdict=?, ai_generated_at=NOW(),
        ai_summary=?, ai_strengths=?, ai_risks=?,
        ai_financial=?, ai_checklist=?, ai_verdict_reason=?
       WHERE id=?`,
      [
        result.opinion,
        result.verdict,
        result.summary,
        JSON.stringify(result.strengths),
        JSON.stringify(result.risks),
        result.financial,
        JSON.stringify(result.checklist),
        result.verdictReason,
        req.params.id,
      ]
    );

    res.json(result);
  } catch (err) {
    console.error('AI 생성 오류:', err.message);
    res.status(500).json({ message: 'AI 의견 생성 중 오류가 발생했습니다.' });
  }
});

// PUT /api/locations/:id/ai-structured — 구조화된 AI 의견 저장
router.put('/:id/ai-structured', requireAuth, async (req, res) => {
  const { summary, strengths, risks, financial, checklist, verdict, verdictReason } = req.body;
  try {
    await pool.query(
      `UPDATE location_data SET
        ai_summary=?, ai_strengths=?, ai_risks=?,
        ai_financial=?, ai_checklist=?, ai_verdict=?, ai_verdict_reason=?
       WHERE id=?`,
      [
        summary,
        JSON.stringify(strengths || []),
        JSON.stringify(risks || []),
        financial,
        JSON.stringify(checklist || []),
        verdict,
        verdictReason,
        req.params.id,
      ]
    );
    res.json({ message: '저장되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '저장 실패' });
  }
});

// PUT /api/locations/:id/ai — AI 의견 저장
router.put('/:id/ai', requireAuth, async (req, res) => {
  const { ai_opinion, ai_verdict } = req.body;
  try {
    await pool.query(
      `UPDATE location_data SET ai_opinion=?, ai_verdict=?, ai_generated_at=NOW() WHERE id=?`,
      [ai_opinion, ai_verdict, req.params.id]
    );
    res.json({ message: 'AI 의견이 저장되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: 'AI 의견 저장 실패' });
  }
});

module.exports = router;