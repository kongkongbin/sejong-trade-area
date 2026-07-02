const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.NAVER_MAPS_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;

// 주소 → 좌표 변환
async function geocode(address) {
  const res = await axios.get(
    'https://maps.apigw.ntruss.com/map-geocode/v2/geocode',
    {
      params: { query: address },
      headers: {
        'x-ncp-apigw-api-key-id': CLIENT_ID,
        'x-ncp-apigw-api-key': CLIENT_SECRET,
      },
    }
  );

  const addresses = res.data.addresses;
  if (!addresses || addresses.length === 0) return null;

  const first = addresses[0];
  return {
    lat: parseFloat(first.y),
    lng: parseFloat(first.x),
    roadAddress: first.roadAddress,
    jibunAddress: first.jibunAddress,
  };
}

// 좌표 → 행정동 코드/이름 반환
async function reverseGeocode(lat, lng) {
  const res = await axios.get(
    'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc',
    {
      params: {
        coords: `${lng},${lat}`,
        orders: 'admcode,roadaddr',
        output: 'json',
      },
      headers: {
        'x-ncp-apigw-api-key-id': CLIENT_ID,
        'x-ncp-apigw-api-key': CLIENT_SECRET,
      },
    }
  );

  const results = res.data.results;
  if (!results || results.length === 0) return null;

  const admResult = results.find(r => r.name === 'admcode');
  const roadResult = results.find(r => r.name === 'roadaddr');

  const region = admResult?.region || results[0].region;
  const area3 = region.area3;
  const area2 = region.area2;
  const area1 = region.area1;
  const code = admResult?.code?.id || '';

  // 도로명 주소 조합
  let roadAddress = null;
  if (roadResult) {
    const r = roadResult;
    const land = r.land;
    roadAddress = `${area1.name} ${area2.name} ${land?.name || ''} ${land?.number1 || ''}${land?.number2 ? '-' + land.number2 : ''}`.trim();
  }

  return {
    dongName: area3.name,
    sigunguName: area2.name,
    sidoName: area1.name,
    dongCode: code,
    roadAddress,
  };
}

// 주소 자동완성 — 여러 결과 반환
async function geocodeSuggest(address, count = 5) {
  const res = await axios.get(
    'https://maps.apigw.ntruss.com/map-geocode/v2/geocode',
    {
      params: { query: address, count },
      headers: {
        'x-ncp-apigw-api-key-id': CLIENT_ID,
        'x-ncp-apigw-api-key': CLIENT_SECRET,
      },
    }
  );

  const addresses = res.data.addresses || [];
  return addresses.map((a) => ({
    lat: parseFloat(a.y),
    lng: parseFloat(a.x),
    roadAddress: a.roadAddress,
    jibunAddress: a.jibunAddress,
  }));
}

module.exports = { geocode, geocodeSuggest, reverseGeocode };