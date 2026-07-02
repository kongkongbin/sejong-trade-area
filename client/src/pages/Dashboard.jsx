import React, { useState, useCallback } from 'react';
import NaverMap from '../components/NaverMap';
import AddressSearch from '../components/AddressSearch';
import FranchiseTab from '../components/tabs/FranchiseTab';
import PopulationTab from '../components/tabs/PopulationTab';
import TransitTab from '../components/tabs/TransitTab';
import { printReport } from '../components/PrintReport';
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
  const [searchedAddress, setSearchedAddress] = useState('');
  const [storeMarkers, setStoreMarkers] = useState([]);
  const [activeStoreId, setActiveStoreId] = useState(null);

  const runAnalysis = useCallback(async ({ lat, lng }, r) => {
    setCenter({ lat, lng });
    setLoading(true);
    setFranchiseData(null);
    setPopulationData(null);
    setTransitData(null);
    setStoreMarkers([]);
    setActiveStoreId(null);

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
    setSearchedAddress('');
    runAnalysis({ lat, lng }, radius);
  }, [radius, runAnalysis]);

  const handleRadiusChange = (e) => {
    const newRadius = Number(e.target.value);
    setRadius(newRadius);
    if (center) runAnalysis(center, newRadius);
  };

  const handleSearchResult = ({ lat, lng, roadAddress, jibunAddress }) => {
    setSearchedAddress(roadAddress || jibunAddress || '');
    runAnalysis({ lat, lng }, radius);
  };

  // 매장 마커 클릭 핸들러
  const handleStoreClick = useCallback((storeOrAction) => {
    if (!storeOrAction) {
      // null이면 마커 초기화
      setStoreMarkers([]);
      setActiveStoreId(null);
      return;
    }

    if (storeOrAction.bulk) {
      // 업종 전체 마커 표시
      setStoreMarkers(storeOrAction.stores.map(s => ({
        ...s,
        categoryCode: storeOrAction.categoryCode,
      })));
      setActiveStoreId(null);
      return;
    }

    // 단일 매장 클릭 — 하이라이트
    setActiveStoreId(storeOrAction.id);
  }, []);

  const handlePrint = () => {
    printReport({ center, address: searchedAddress, radius, populationData, franchiseData, transitData });
  };

  const hasData = populationData || franchiseData || transitData;

  return (
    <>
      <div className="dashboard">
        <div className="map-panel">
          <NaverMap
            center={center}
            radius={radius}
            onMapClick={handleMapClick}
            storeMarkers={storeMarkers}
          />
        </div>

        <div className="data-panel">
          <AddressSearch onResult={handleSearchResult} />

          {searchedAddress && (
            <div style={{
              fontSize: 12, color: '#5a6a7e', marginBottom: 12,
              padding: '6px 10px', background: '#f5ecd4',
              borderRadius: 6, borderLeft: '3px solid #c9a84c',
            }}>
              📍 {searchedAddress}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#5a6a7e', fontWeight: 500 }}>분석 반경</span>
            <select value={radius} onChange={handleRadiusChange}>
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </option>
              ))}
            </select>
            {center && center.lat != null && (
              <span style={{ fontSize: 11, color: '#9aa5b1' }}>
                {Number(center.lat).toFixed(4)}, {Number(center.lng).toFixed(4)}
              </span>
            )}
            {hasData && (
              <button
                onClick={handlePrint}
                style={{
                  marginLeft: 'auto',
                  height: 32, padding: '0 12px',
                  background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
                  color: '#0d1b2e', border: 'none', borderRadius: 6,
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(201,168,76,0.3)',
                }}
              >
                🖨️ 인쇄/PDF
              </button>
            )}
          </div>

          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? 'active' : ''}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key !== 'franchise') {
                    setStoreMarkers([]);
                    setActiveStoreId(null);
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div>
            {activeTab === 'population' && <PopulationTab data={populationData} loading={loading} />}
            {activeTab === 'franchise' && (
              <FranchiseTab
                data={franchiseData}
                loading={loading}
                onStoreClick={handleStoreClick}
                activeStoreId={activeStoreId}
              />
            )}
            {activeTab === 'transit' && <TransitTab data={transitData} loading={loading} />}
            {!['population', 'franchise', 'transit'].includes(activeTab) && (
              <p style={{ color: '#9aa5b1', fontSize: 13, marginTop: 8 }}>
                [{TABS.find((t) => t.key === activeTab)?.label}] — 다음 단계에서 추가 예정
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}