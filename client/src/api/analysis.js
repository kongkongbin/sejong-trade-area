import api from './axios';

export async function fetchFranchiseAnalysis({ lat, lng, radius }) {
  const res = await api.post('/analysis/franchise', { lat, lng, radius });
  return res.data;
}

export async function fetchPopulationAnalysis({ lat, lng }) {
  const res = await api.post('/analysis/population', { lat, lng });
  return res.data;
}

export async function fetchTransitAnalysis({ lat, lng, radius }) {
  const res = await api.post('/analysis/transit', { lat, lng, radius });
  return res.data;
}

export async function fetchFacilityAnalysis({ lat, lng, radius }) {
  const res = await api.post('/analysis/facility', { lat, lng, radius });
  return res.data;
}

export async function fetchReverseGeocode({ lat, lng }) {
  const res = await api.post('/analysis/reverse-geocode', { lat, lng });
  return res.data;
}

export async function fetchScore({ populationData, transitData, franchiseData, facilityData }) {
  const res = await api.post('/analysis/score', { populationData, transitData, franchiseData, facilityData });
  return res.data;
}