const axios = require('axios');
require('dotenv').config();

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
  const monthlyRevenue = (Number(expected_daily_sales)||0) * 25;
  const monthlyFixed = Number(monthly_rent) || 0;
  const monthlyProfit = monthlyRevenue - monthlyFixed;
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(totalInitial / monthlyProfit) : null;

  const prompt = `당신은 대구광역시 상권/입지 분석 전문가입니다. 세종홀딩스의 부동산 중개 전문가로서 다음 데이터를 바탕으로 종합적인 입지 분석 의견을 작성해주세요.

## 분석 대상 위치
- 주소: ${address}
- 입점 예정 업종: ${target_business || '미입력'}
- 층수: ${floor_info || '미입력'}
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

위 데이터를 바탕으로 다음 형식으로 분석해주세요:

**1. 입지 핵심 요약** (3줄 이내)

**2. 강점**
- (3~5가지)

**3. 리스크**
- (3~5가지)

**4. 재무 분석**
투자금 회수 기간, 손익분기점, 적정 임대료 협상 제안

**5. 계약 전 확인 체크리스트**
- [ ] 항목들

**6. 세종의 최종 의견: GO / 조건부 GO / NO-GO**
판정 이유 2~3문장`;

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

  let verdict = 'CONDITIONAL_GO';
  if (text.includes('NO-GO') || text.includes('NO GO')) verdict = 'NO_GO';
  else if (text.match(/최종 의견.*: GO/) && !text.includes('NO-GO')) verdict = 'GO';

  return { opinion: text, verdict };
}

module.exports = { generateAIOpinion };