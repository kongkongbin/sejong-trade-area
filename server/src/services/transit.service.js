const pool = require('../config/db');

async function getTransitAnalysis(lat, lng, radius) {
  // 반경 내 지하철역 조회
  const [subwayRows] = await pool.query(
    `SELECT name, line_name, lat, lng, daily_avg_riders,
       ROUND(ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?))) AS distance
     FROM transit_stations
     WHERE type = 'subway'
       AND ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) <= ?
     ORDER BY distance`,
    [lng, lat, lng, lat, radius]
  );

  // 반경 내 버스 정류장 조회
  const [busRows] = await pool.query(
    `SELECT name, lat, lng, daily_avg_riders,
       ROUND(ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?))) AS distance
     FROM transit_stations
     WHERE type = 'bus'
       AND ST_Distance_Sphere(POINT(lng, lat), POINT(?, ?)) <= ?
     ORDER BY distance
     LIMIT 50`,
    [lng, lat, lng, lat, radius]
  );

  return {
    subway: {
      count: subwayRows.length,
      stations: subwayRows.map((r) => ({
        name: r.name,
        line: r.line_name,
        distance: r.distance,
        dailyRiders: r.daily_avg_riders,
      })),
    },
    bus: {
      count: busRows.length,
      stations: busRows.map((r) => ({
        name: r.name,
        distance: r.distance,
        dailyRiders: r.daily_avg_riders,
      })),
    },
  };
}

module.exports = { getTransitAnalysis };