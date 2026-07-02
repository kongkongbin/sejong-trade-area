const pool = require('../config/db');

async function getFacilityAnalysis(lat, lng, radius) {
  const [rows] = await pool.query(
    `SELECT category, name, address, lat, lng,
       ROUND(ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?))) AS distance
     FROM facilities
     WHERE ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) <= ?
     ORDER BY category, distance`,
    [lng, lat, lng, lat, radius]
  );

  const result = {
    hospital: { count: 0, items: [] },
    kindergarten: { count: 0, items: [] },
    elementary: { count: 0, items: [] },
    middle: { count: 0, items: [] },
    high: { count: 0, items: [] },
  };

  for (const row of rows) {
    const cat = row.category;
    if (!result[cat]) continue;
    result[cat].count++;
    result[cat].items.push({
      name: row.name,
      address: row.address,
      distance: row.distance,
    });
  }

  return result;
}

module.exports = { getFacilityAnalysis };