const axios = require('axios');
const pool = require('../config/db');
require('dotenv').config();

// 같은 업종으로 이미 AI 분석이 끝난 과거 입지 사례 조회 (최근 3건)
async function findSimilarLocations(currentId, targetBusiness) {
  if (!targetBusiness) return [];

  const [rows] = await pool.query(
    `SELECT address, monthly_rent, expected_daily_sales, ai_verdict, ai_summary, ai_verdict_reason
     FROM location_data
     WHERE target_business = ?
       AND id != ?
       AND ai_verdict IS NOT NULL
     ORDER BY ai_generated_at DESC
     LIMIT 3`,
    [targetBusiness, currentId]
  );

  return rows;
}

const VERDICT_LABEL = {
  GO: 'GO',
  CONDITIONAL_GO: '조건부 GO',
  NO_GO: 'NO-GO',
};

// 유사 사례 목록을 프롬프트에 넣을 텍스트로 변환
function buildSimilarCasesText(similarCases) {
  if (!similarCases.length) {
    return '(같은 업종의 과거 분석 사례 없음)';
  }

  return similarCases
    .map((c, i) => {
      const verdict = VERDICT_LABEL[c.ai_verdict] || c.ai_verdict || '-';
      const rent = c.monthly_rent ? `월세 ${Number(c.monthly_rent).toLocaleString()}만원` : '월세 미입력';
      const summary = (c.ai_summary || c.ai_verdict_reason || '').slice(0, 80);
      return `${i + 1}. ${c.address} — ${rent} — 판정: ${verdict}${summary ? ` — ${summary}` : ''}`;
    })
    .join('\n');
}

// AI 응답 텍스트를 구조화된 데이터로 파싱
function parseAIResponse(text) {
  const result = {
    summary: '',
    strengths: [],
    risks: [],
    financial: '',
    checklist: [],
    verdict: 'CONDITIONAL_GO',
    verdictReason: '',
  };

  // 섹션별로 분리
  const sections = text.split(/##\s+\d+\./);

  sections.forEach((section) => {
    const trimmed = section.trim();

    if (trimmed.startsWith('입지 핵심 요약') || trimmed.startsWith('1. 입지')) {
      result.summary = trimmed.replace(/^입지 핵심 요약.*?\n/, '').replace(/^1\. 입지.*?\n/, '').trim();
    }
    else if (trimmed.startsWith('강점') || trimmed.startsWith('2. 강점')) {
      const lines = trimmed.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().match(/^[-•*]\s/));
      result.strengths = lines.map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim()).filter(s => s && !s.match(/^-+$/));
    }
    else if (trimmed.startsWith('리스크') || trimmed.startsWith('3. 리스크')) {
      const lines = trimmed.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().match(/^[-•*]\s/));
      result.risks = lines.map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim()).filter(s => s && !s.match(/^-+$/));
    }
    else if (trimmed.startsWith('재무 분석') || trimmed.startsWith('4. 재무')) {
      result.financial = trimmed.replace(/^재무 분석.*?\n/, '').replace(/^4\. 재무.*?\n/, '').trim();
    }
    else if (trimmed.startsWith('계약 전') || trimmed.startsWith('5. 계약')) {
      const lines = trimmed.split('\n').filter(l => l.trim().startsWith('- ['));
      result.checklist = lines.map(l => ({
        text: l.replace(/^-\s*\[[ x]\]\s*/, '').trim(),
        checked: l.includes('[x]') || l.includes('[X]'),
      })).filter(item => item.text);
    }
    else if (trimmed.startsWith('세종의 최종') || trimmed.startsWith('6. 세종')) {
      if (trimmed.includes('NO-GO') || trimmed.includes('NO GO')) result.verdict = 'NO_GO';
      else if (trimmed.match(/GO(?!.*NO)/) && !trimmed.includes('조건부')) result.verdict = 'GO';
      else result.verdict = 'CONDITIONAL_GO';

      // 판정 이유 추출
      const lines = trimmed.split('\n').filter(l => l.trim() && !l.includes('GO') && !l.includes('NO-GO'));
      result.verdictReason = lines.slice(1).join(' ').trim();
    }
  });

  // 파싱 실패시 전체 텍스트에서 강점/리스크 추출 시도
  if (result.strengths.length === 0) {
    const strengthMatch = text.match(/강점[^\n]*\n([\s\S]*?)(?=##|리스크|$)/);
    if (strengthMatch) {
      result.strengths = strengthMatch[1].split('\n')
        .filter(l => l.trim().match(/^[-•*]\s/))
        .map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim())
        .filter(Boolean);
    }
  }
  if (result.risks.length === 0) {
    const riskMatch = text.match(/리스크[^\n]*\n([\s\S]*?)(?=##|재무|$)/);
    if (riskMatch) {
      result.risks = riskMatch[1].split('\n')
        .filter(l => l.trim().match(/^[-•*]\s/))
        .map(l => l.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim())
        .filter(Boolean);
    }
  }
  if (result.checklist.length === 0) {
    const checkMatch = text.match(/체크리스트[^\n]*\n([\s\S]*?)(?=##|세종|$)/);
    if (checkMatch) {
      result.checklist = checkMatch[1].split('\n')
        .filter(l => l.trim().startsWith('- ['))
        .map(l => ({
          text: l.replace(/^-\s*\[[ x]\]\s*/i, '').trim(),
          checked: false,
        }))
        .filter(item => item.text);
    }
  }

  return result;
}

async function generateAIOpinion({ locationData, analysisData }) {
  const {
    id, address, target_business, premium, deposit, monthly_rent,
    interior_budget, other_initial_cost, avg_price_per_customer,
    expected_daily_sales, business_hours, visibility_score,
    accessibility_score, parking_available, building_age,
    has_elevator, is_corner, floor_info, area_pyeong, nearby_vacancy_rate,
    redevelopment_plan, redevelopment_note, landlord_note,
    field_memo, contract_period, landlord_asking_rent, desired_rent,
  } = locationData;

  const { populationData, transitData, franchiseData, facilityData, scoreData } = analysisData;

  const similarCases = await findSimilarLocations(id, target_business);
  const similarCasesText = buildSimilarCasesText(similarCases);

  const totalInitial = (Number(premium)||0) + (Number(deposit)||0) +
    (Number(interior_budget)||0) + (Number(other_initial_cost)||0);
  const monthlyRevenue = (Number(expected_daily_sales)||0) * 25;
  const monthlyFixed = Number(monthly_rent) || 0;
  const monthlyProfit = monthlyRevenue - monthlyFixed;
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalInitial / monthlyProfit) : null;

  const prompt = `당신은 대구광역시 상권/입지 분석 전문가입니다. 세종홀딩스의 부동산 중개 전문가로서 다음 데이터를 바탕으로 종합적인 입지 분석 의견을 작성해주세요.

## 분석 대상 위치
- 주소: ${address}
- 입점 예정 업종: ${target_business || '미입력'}
- 층수: ${floor_info || '미입력'}
- 전용면적: ${area_pyeong ? `${area_pyeong}평` : '미입력'}
- 코너 위치: ${is_corner ? '예' : '아니오'}

## 재무 현황
- 권리금: ${premium ? `${Number(premium).toLocaleString()}만원` : '미입력'}
- 보증금: ${deposit ? `${Number(deposit).toLocaleString()}만원` : '미입력'}
- 월세: ${monthly_rent ? `${Number(monthly_rent).toLocaleString()}만원` : '미입력'}
- 인테리어 예산: ${interior_budget ? `${Number(interior_budget).toLocaleString()}만원` : '미입력'}
- 총 초기투자금: ${totalInitial.toLocaleString()}만원
- 예상 일매출: ${expected_daily_sales ? `${Number(expected_daily_sales).toLocaleString()}만원` : '미입력'}
- 예상 월매출: ${monthlyRevenue.toLocaleString()}만원
- 투자금 회수 예상: ${paybackMonths ? `약 ${paybackMonths}개월` : '계산 불가'}
- 임대인 제시 임대료: ${landlord_asking_rent ? `${Number(landlord_asking_rent).toLocaleString()}만원` : '미입력'}
- 희망 임대료: ${desired_rent ? `${Number(desired_rent).toLocaleString()}만원` : '미입력'}

## 상권 분석 데이터 (반경 ${analysisData.radius || 500}m)
- 종합 상권 점수: ${scoreData?.totalScore || '-'}점 / 100점 (${scoreData?.grade?.grade || '-'} 등급)
- 거주인구: ${populationData?.total?.toLocaleString() || '-'}명 (${populationData?.maxAge || '-'} 최다)
- 대구 평균 대비: ${scoreData?.breakdown?.population?.compareText || '-'}
- 지하철역: ${transitData?.subway?.count || 0}개
- 버스 정류장: ${transitData?.bus?.count || 0}개
- 총 상가업소: ${franchiseData?.totalCount?.toLocaleString() || '-'}개
- 주요 업종: ${franchiseData?.byCategory?.slice(0,3).map(c => `${c.name}(${c.count}개)`).join(', ') || '-'}
- 의료기관: ${facilityData?.hospital?.count || 0}개
- 학교: ${(facilityData?.elementary?.count||0)+(facilityData?.middle?.count||0)+(facilityData?.high?.count||0)}개

## 현장 조사
- 가시성: ${visibility_score}/5점
- 접근성: ${accessibility_score}/5점
- 주차: ${parking_available ? '가능' : '불가'}
- 건물 연식: ${building_age ? `${building_age}년` : '미입력'}
- 주변 공실/폐업 비율 체감: ${nearby_vacancy_rate || 0}%
- 재개발 계획: ${redevelopment_plan ? `있음 (${redevelopment_note || ''})` : '없음'}
- 임대인 특이사항: ${landlord_note || '없음'}
- 현장 메모: ${field_memo || '없음'}

## 유사 사례 (같은 업종의 과거 분석 결과, 참고용)
${similarCasesText}
위 사례들과 비교했을 때 이번 입지가 상대적으로 어떤지도 참고해서 의견에 반영해주세요. 단, 사례가 없으면 이 항목은 무시하세요.

반드시 아래 형식을 정확히 지켜서 작성해주세요 (파싱에 사용됩니다):

## 1. 입지 핵심 요약
(3줄 이내 핵심 요약)

## 2. 강점
- 강점 1
- 강점 2
- 강점 3

## 3. 리스크
- 리스크 1
- 리스크 2
- 리스크 3

## 4. 재무 분석
(투자금 회수 기간, 손익분기점, 적정 임대료 협상 제안)

## 5. 계약 전 확인 체크리스트
- [ ] 항목 1
- [ ] 항목 2
- [ ] 항목 3

## 6. 세종의 최종 의견: GO / 조건부 GO / NO-GO
(판정 이유 2~3문장)`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const text = response.data.content[0].text;
  const parsed = parseAIResponse(text);

  return {
    opinion: text, // 원본 텍스트 (하위 호환)
    ...parsed,
  };
}

module.exports = { generateAIOpinion };