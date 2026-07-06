const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/db');
const axios = require('axios');
require('dotenv').config();

const SYSTEM_PROMPT = `당신은 세종홀딩스의 AI 입지 상담 어시스턴트입니다.
부동산 중개 전문가 세종의 현장 조사를 도와 입지 데이터를 수집하는 역할입니다.

대화를 통해 다음 정보를 자연스럽게 수집하세요:
1. 주소 (필수)
2. 입점 예정 업종
3. 권리금 (만원)
4. 보증금 (만원)  
5. 월세 (만원)
6. 인테리어 예산 (만원)
7. 층수 정보
8. 가시성/접근성 (1~5점)
9. 주차 가능 여부
10. 현장 특이사항/메모

규칙:
- 한 번에 1~2개 질문만 하세요
- 자연스럽고 친근하게 대화하세요
- 답변이 없거나 모르면 넘어가세요
- 핵심 정보(주소, 월세)가 모이면 정리하고 완료 신호를 보내세요
- 완료 시 응답 맨 끝에 반드시 [COMPLETE]를 붙이세요
- 데이터 추출 시 응답에 JSON 블록을 포함하세요: \`\`\`json {"field": "value"}\`\`\`
  사용 가능한 필드: address, target_business, premium, deposit, monthly_rent, 
  interior_budget, floor_info, visibility_score, accessibility_score, 
  parking_available (true/false), field_memo

예시:
사용자: "수성구 범어동 OO빌딩 1층이에요"
응답: "범어동 OO빌딩 1층이군요! 어떤 업종으로 입점 예정이신가요?
\`\`\`json
{"address": "대구 수성구 범어동 OO빌딩 1층"}
\`\`\`"`;

// POST /api/chat/message
router.post('/message', requireAuth, async (req, res) => {
  const { messages, locationId } = req.body;

  try {
    // Claude API 호출
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
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

    const reply = response.data.content[0].text;
    const isComplete = reply.includes('[COMPLETE]');

    // JSON 데이터 추출
    const jsonMatch = reply.match(/```json\n?([\s\S]*?)\n?```/);
    let extractedData = {};
    if (jsonMatch) {
      try { extractedData = JSON.parse(jsonMatch[1]); } catch {}
    }

    // 화면에 보여줄 텍스트에서는 [COMPLETE] 태그와 json 코드블록 둘 다 제거
    const cleanReply = reply
      .replace('[COMPLETE]', '')
      .replace(/```json\n?[\s\S]*?\n?```/, '')
      .trim();

    // DB 저장/업데이트
    let currentLocationId = locationId;
    if (Object.keys(extractedData).length > 0) {
      if (currentLocationId) {
        // 기존 레코드 업데이트
        const setClauses = Object.keys(extractedData).map(k => `${k}=?`).join(',');
        await pool.query(
          `UPDATE location_data SET ${setClauses} WHERE id=?`,
          [...Object.values(extractedData), currentLocationId]
        );
      } else if (extractedData.address) {
        // 새 레코드 생성
        const [result] = await pool.query(
          `INSERT INTO location_data (address, created_by) VALUES (?, ?)`,
          [extractedData.address, req.user.id]
        );
        currentLocationId = result.insertId;

        // 나머지 필드 업데이트
        const otherFields = { ...extractedData };
        delete otherFields.address;
        if (Object.keys(otherFields).length > 0) {
          const setClauses = Object.keys(otherFields).map(k => `${k}=?`).join(',');
          await pool.query(
            `UPDATE location_data SET ${setClauses} WHERE id=?`,
            [...Object.values(otherFields), currentLocationId]
          );
        }
      }
    }

    res.json({
      reply: cleanReply,
      locationId: currentLocationId,
      isComplete,
      extractedData,
    });
  } catch (err) {
    console.error('채팅 오류:', err.message);
    res.status(500).json({ message: '채팅 처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router;