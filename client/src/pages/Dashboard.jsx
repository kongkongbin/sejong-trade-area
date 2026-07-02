import React, { useState, useCallback } from 'react';
import NaverMap from '../components/NaverMap';
import AddressSearch from '../components/AddressSearch';
import ScoreCard from '../components/ScoreCard';
import AIOpinionCard from '../components/AIOpinionCard';
import FranchiseTab from '../components/tabs/FranchiseTab';
import PopulationTab from '../components/tabs/PopulationTab';
import TransitTab from '../components/tabs/TransitTab';
import HospitalTab from '../components/tabs/HospitalTab';
import ChildcareTab from '../components/tabs/ChildcareTab';
import SchoolTab from '../components/tabs/SchoolTab';
import { printReport } from '../components/PrintReport';
import {
  fetchFranchiseAnalysis, fetchPopulationAnalysis,
  fetchTransitAnalysis, fetchFacilityAnalysis,
  fetchReverseGeocode, fetchScore,
} from '../api/analysis';

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
  const [facilityData, setFacilityData] = useState(null);
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [storeMarkers, setStoreMarkers] = useState([]);
  const [activeStore, setActiveStore] = useState(null);

  const runAnalysis = useCallback(async ({ lat, lng }, r) => {
    setCenter({ lat, lng });
    setLoading(true);
    setFranchiseData(null);
    setPopulationData(null);
    setTransitData(null);
    setFacilityData(null);
    setScoreData(null);
    setStoreMarkers([]);
    setActiveStore(null);

    const [franchise, population, transit, facility] = await Promise.allSettled([
      fetchFranchiseAnalysis({ lat, lng, radius: r }),
      fetchPopulationAnalysis({ lat, lng }),
      fetchTransitAnalysis({ lat, lng, radius: r }),
      fetchFacilityAnalysis({ lat, lng, radius: r }),
    ]);

    const fd = franchise.status === 'fulfilled' ? franchise.value : null;
    const pd = population.status === 'fulfilled' ? population.value : null;
    const td = transit.status === 'fulfilled' ? transit.value : null;
    const fcd = facility.status === 'fulfilled' ? facility.value : null;

    if (fd) setFranchiseData(fd);
    if (pd) setPopulationData(pd);
    if (td) setTransitData(td);
    if (fcd) setFacilityData(fcd);

    setLoading(false);

    // 점수 계산 (4개 분석 끝난 후) - 무거운 매장 리스트 제외하고 전송
    if (fd || pd || td || fcd) {
      try {
        const lightFd = fd ? {
          totalCount: fd.totalCount,
          byCategory: fd.byCategory?.map(({ code, name, count, competitionLevel }) => ({
            code, name, count, competitionLevel
          })),
        } : null;

        const score = await fetchScore({
          populationData: pd,
          transitData: td,
          franchiseData: lightFd,
          facilityData: fcd,
        });
        setScoreData(score);
      } catch {}
    }
  }, []);

  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setSearchedAddress('');
    runAnalysis({ lat, lng }, radius);
    try {
      const geo = await fetchReverseGeocode({ lat, lng });
      if (geo) {
        const addr = geo.roadAddress || `${geo.sidoName} ${geo.sigunguName} ${geo.dongName}`;
        setSearchedAddress(addr);
      }
    } catch {}
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

  const handleStoreClick = useCallback((storeOrAction) => {
    if (!storeOrAction) { setStoreMarkers([]); setActiveStore(null); return; }
    if (storeOrAction.bulk) {
      setStoreMarkers(storeOrAction.stores.map(s => ({ ...s, categoryCode: storeOrAction.categoryCode })));
      setActiveStore(null);
      return;
    }
    setActiveStore(storeOrAction);
  }, []);

  const handlePrint = () => {
    printReport({ center, address: searchedAddress, radius, populationData, franchiseData, transitData, facilityData, scoreData });
  };

  const hasData = populationData || franchiseData || transitData || facilityData;

  return (
    <div className="dashboard">
      <div className="map-panel">
        <NaverMap
          center={center}
          radius={radius}
          onMapClick={handleMapClick}
          storeMarkers={storeMarkers}
          activeStore={activeStore}
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
              <option key={r} value={r}>{r >= 1000 ? `${r / 1000}km` : `${r}m`}</option>
            ))}
          </select>
          {center && center.lat != null && (
            <span style={{ fontSize: 11, color: '#9aa5b1' }}>
              {Number(center.lat).toFixed(4)}, {Number(center.lng).toFixed(4)}
            </span>
          )}
          {hasData && (
            <button onClick={handlePrint} style={{
              marginLeft: 'auto', height: 32, padding: '0 12px',
              background: 'linear-gradient(135deg, #c9a84c, #e8c96a)',
              color: '#0d1b2e', border: 'none', borderRadius: 6,
              fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(201,168,76,0.3)',
            }}>
              🖨️ 인쇄/PDF
            </button>
          )}
        </div>

        {/* 종합 점수 카드 */}
        {(scoreData || loading) && (
          <ScoreCard scoreData={scoreData} loading={loading && !scoreData} />
        )}

        {/* AI 의견 생성 */}
        {hasData && !loading && (
          <AIOpinionCard
            center={center}
            address={searchedAddress}
            radius={radius}
            populationData={populationData}
            franchiseData={franchiseData}
            transitData={transitData}
            facilityData={facilityData}
            scoreData={scoreData}
          />
        )}

        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== 'franchise') { setStoreMarkers([]); setActiveStore(null); }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'population' && <PopulationTab data={populationData} loading={loading} />}
          {activeTab === 'franchise' && (
            <FranchiseTab data={franchiseData} loading={loading} onStoreClick={handleStoreClick} activeStoreId={activeStore?.id} />
          )}
          {activeTab === 'transit' && <TransitTab data={transitData} loading={loading} />}
          {activeTab === 'hospital' && <HospitalTab data={facilityData} loading={loading} />}
          {activeTab === 'childcare' && <ChildcareTab data={facilityData} loading={loading} />}
          {activeTab === 'school' && <SchoolTab data={facilityData} loading={loading} />}
        </div>
      </div>
    </div>
  );
}