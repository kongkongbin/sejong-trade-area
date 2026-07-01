const axios = require('axios');
require('dotenv').config();

const CLIENT_ID = process.env.NAVER_MAPS_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;

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

module.exports = { reverseGeocode };