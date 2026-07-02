const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 60000, // 60초
  maxRetries: 2,
});

function formatMoney(val) {
  return val ? `${Number(val).toLocaleString()}만원` : '미입력';
}

async function generateAIOpinion({ locationData, analysisData }) {
  const {
    address, target_business, premium, deposit, monthly_rent,
    interior_budget, other_initial_cost, avg_price_per_customer,
    expected_daily_sales, business_hours, visibility_score,
    accessibility_score, parking_available, building_age,
    has_elevator, is_corner, floor_info, nearby_vacancy_rate,
    redevelopment_plan, redevelopment_note, landlord_note,
    field_memo, contract_period, landlord_asking_rent, desired_rent,
  } = locationData;

  const { populationData, transitData, franchiseData, facilityData, scoreData } = analysisData;

  const totalInitial = (Number(premium)||0) + (Number(deposit)||0) +
    (Number(interior_budget)||0) + (Number(other_initial_cost)||0);

  // 월 예상 매출
  const monthlyRevenue = (Number(expected_daily_sales)||0) * 25;
  // 월 고정비 (월세)
  const monthlyFixed = Number(monthly_rent) || 0;
  // 투자금 회수 기간 추정
  const monthlyProfit = monthlyRevenue - monthlyFixed;
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalInitial / monthlyProfit) : null;

  const prompt = `당신은 대구광역시 상권/입지 분석 전문가입니다. 세종홀딩스의 부동산 중개 전문가로서 다음 데이터를 바탕으로 종합적인 입지 분석 의견을 작성해주세요.

## 분석 대상 위치
- 주소: ${address}
- 입점 예정 업종: ${target_business || '미입력'}
- 층수: ${floor_info || '미입력'}
- 코너 위치: ${is_corner ? '예' : '아니오'}

## 재무 현황
- 권리금: ${formatMoney(premium)}
- 보증금: ${formatMoney(deposit)}
- 월세: ${formatMoney(monthly_rent)}
- 인테리어 예산: ${formatMoney(interior_budget)}
- 총 초기투자금: ${formatMoney(totalInitial)}
- 예상 객단가: ${avg_price_per_customer ? `${Number(avg_price_per_customer).toLocaleString()}원` : '미입력'}
- 예상 일매출: ${formatMoney(expected_daily_sales)}
- 예상 월매출: ${formatMoney(monthlyRevenue)}
- 투자금 회수 예상: ${paybackMonths ? `약 ${paybackMonths}개월` : '계산 불가'}
- 임대인 제시 임대료: ${formatMoney(landlord_asking_rent)}
- 희망 임대료: ${formatMoney(desired_rent)}

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
- 유치원: ${facilityData?.kindergarten?.count || 0}개

## 현장 조사
- 가시성: ${visibility_score}/5점
- 접근성: ${accessibility_score}/5점
- 주차: ${parking_available ? '가능' : '불가'}
- 건물 연식: ${building_age ? `${building_age}년` : '미입력'}
- 엘리베이터: ${has_elevator ? '있음' : '없음'}
- 주변 공실/폐업 비율 체감: ${nearby_vacancy_rate || 0}%
- 재개발 계획: ${redevelopment_plan ? `있음 (${redevelopment_note || ''})` : '없음'}
- 임대인 특이사항: ${landlord_note || '없음'}
- 현장 메모: ${field_memo || '없음'}

## 계약 조건
- 계약 기간: ${contract_period || '미입력'}
- 영업시간: ${business_hours || '미입력'}

위 데이터를 바탕으로 다음 형식으로 분석해주세요:

**1. 입지 핵심 요약** (3줄 이내)

**2. 강점**
- (불릿 포인트로 3~5가지)

**3. 리스크**
- (불릿 포인트로 3~5가지)

**4. 재무 분석**
투자금 회수 기간, 손익분기점, 적정 임대료 협상 제안 등

**5. 계약 전 확인 체크리스트**
- [ ] 항목들

**6. 세종의 최종 의견: GO / 조건부 GO / NO-GO**
판정 이유를 2~3문장으로 설명

전문적이되 실무적으로, 핵심만 간결하게 작성해주세요.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;

  // GO/NO-GO 판정 추출
  let verdict = 'CONDITIONAL_GO';
  if (text.includes('NO-GO') || text.includes('NO GO')) verdict = 'NO_GO';
  else if (text.match(/최종 의견.*GO(?!.*NO)/)) verdict = 'GO';

  return { opinion: text, verdict };
}

module.exports = { generateAIOpinion };