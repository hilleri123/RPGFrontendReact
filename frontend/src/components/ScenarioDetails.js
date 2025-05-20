import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationsTab from './tabs/LocationsTab';
import NPCsTab from './tabs/NPCsTab';
import PlayerCharactersTab from './tabs/PlayerCharactersTab';
import GameItemsTab from './tabs/GameItemsTab';

const ScenarioDetails = () => {
  const [activeTab, setActiveTab] = useState('locations');
  const [scenario, setScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { scenarioId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await axios.get(`/api/scenarios/${scenarioId}`);
        setScenario(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке сценария:', err);
        setError('Не удалось загрузить сценарий');
        setIsLoading(false);
      }
    };

    fetchScenario();
  }, [scenarioId]);

  if (isLoading) {
    return <div className="loading">Загрузка сценария...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="scenario-details">
      <div className="scenario-header">
        <h2>Управление элементами сценария: {scenario.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/scenarios')}>
          Назад к сценариям
        </button>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          <button
            className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Локации
          </button>
          <button
            className={`tab-button ${activeTab === 'npcs' ? 'active' : ''}`}
            onClick={() => setActiveTab('npcs')}
          >
            NPC
          </button>
          <button
            className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            Персонажи игроков
          </button>
          <button
            className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Игровые предметы
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'locations' && <LocationsTab scenarioId={scenarioId} />}
          {activeTab === 'npcs' && <NPCsTab scenarioId={scenarioId} />}
          {activeTab === 'characters' && <PlayerCharactersTab scenarioId={scenarioId} />}
          {activeTab === 'items' && <GameItemsTab scenarioId={scenarioId} />}
        </div>
      </div>
    </div>
  );
};

export default ScenarioDetails;
