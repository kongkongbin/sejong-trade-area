import React, { useState, useCallback } from 'react';
import NaverMap from '../components/NaverMap';
import FranchiseTab from '../components/tabs/FranchiseTab';
import PopulationTab from '../components/tabs/PopulationTab';
import TransitTab from '../components/tabs/TransitTab';
import { fetchFranchiseAnalysis, fetchPopulationAnalysis, fetchTransitAnalysis } from '../api/analysis';

const TABS = [
  { key: 'population', label: '생활인구' },
  { key: 'franchise', label: '프랜차이즈' },
  { key: 'transit', label: '대중교통' },
  { key: 'hospital', label: '종합병원' },
  { key: 'childcare', label: '보육시설' },
  { key: 'school', label: '학교' },
];

const RADIUS_OPTIONS = [100, 300, 500, 1000, 1500, 2000, 3000];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('population');
  const [radius, setRadius] = useState(500);
  const [center, setCenter] = useState(null);
  const [franchiseData, setFranchiseData] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [transitData, setTransitData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = useCallback(async ({ lat, lng }, r) => {
    setCenter({ lat, lng });
    setLoading(true);
    setFranchiseData(null);
    setPopulationData(null);
    setTransitData(null);

    const [franchise, population, transit] = await Promise.allSettled([
      fetchFranchiseAnalysis({ lat, lng, radius: r }),
      fetchPopulationAnalysis({ lat, lng }),
      fetchTransitAnalysis({ lat, lng, radius: r }),
    ]);

    if (franchise.status === 'fulfilled') setFranchiseData(franchise.value);
    if (population.status === 'fulfilled') setPopulationData(population.value);
    if (transit.status === 'fulfilled') setTransitData(transit.value);

    setLoading(false);
  }, []);

  const handleMapClick = useCallback(({ lat, lng }) => {
    runAnalysis({ lat, lng }, radius);
  }, [radius, runAnalysis]);

  const handleRadiusChange = (e) => {
    const newRadius = Number(e.target.value);
    setRadius(newRadius);
    if (center) runAnalysis(center, newRadius);
  };

  return (
    <div className="dashboard">
      <div className="map-panel">
        <NaverMap center={center} radius={radius} onMapClick={handleMapClick} />
      </div>

      <div className="data-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#666' }}>분석 반경</span>
          <select value={radius} onChange={handleRadiusChange} style={{ fontSize: 13 }}>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </option>
            ))}
          </select>
          {center && center.lat != null && (
            <span style={{ fontSize: 12, color: '#aaa', marginLeft: 'auto' }}>
              {Number(center.lat).toFixed(5)}, {Number(center.lng).toFixed(5)}
            </span>
          )}
        </div>

        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {activeTab === 'population' && <PopulationTab data={populationData} loading={loading} />}
          {activeTab === 'franchise' && <FranchiseTab data={franchiseData} loading={loading} />}
          {activeTab === 'transit' && <TransitTab data={transitData} loading={loading} />}
          {!['population', 'franchise', 'transit'].includes(activeTab) && (
            <p style={{ color: '#aaa', fontSize: 13 }}>
              [{TABS.find((t) => t.key === activeTab)?.label}] — 다음 단계에서 추가 예정
            </p>
          )}
        </div>
      </div>
    </div>
  );
}