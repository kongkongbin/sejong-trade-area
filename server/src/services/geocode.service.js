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
        orders: 'admcode',
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

  const region = results[0].region;
  const area3 = region.area3;
  const area2 = region.area2;
  const code = results[0].code?.id || '';

  return {
    dongName: area3.name,
    sigunguName: area2.name,
    dongCode: code,
  };
}

module.exports = { geocode, reverseGeocode };