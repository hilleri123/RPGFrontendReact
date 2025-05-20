import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SkillGroupTab from './tabs/SkillGroupTab';
import SkillsTab from './tabs/SkillsTab';
import GameItemSchemeTab from './tabs/GameItemSchemeTab';
import BodiesTab from './tabs/BodiesTab';

const RuleDetails = () => {
  const [activeTab, setActiveTab] = useState('skillGroups');
  const [rule, setRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { ruleId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRule = async () => {
      try {
        const response = await axios.get(`/api/rules/${ruleId}`);
        setRule(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке правил:', err);
        setError('Не удалось загрузить правила');
        setIsLoading(false);
      }
    };

    fetchRule();
  }, [ruleId]);

  if (isLoading) {
    return <div className="loading">Загрузка правил...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="rule-details">
      <div className="rule-header">
        <h2>Управление элементами правил: {rule.name}</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/rules')}>
          Назад к правилам
        </button>
      </div>

      <div className="tabs">
        <div className="tab-nav">
          <button
            className={`tab-button ${activeTab === 'skillGroups' ? 'active' : ''}`}
            onClick={() => setActiveTab('skillGroups')}
          >
            Группы навыков
          </button>
          <button
            className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Навыки
          </button>
          <button
            className={`tab-button ${activeTab === 'itemSchemes' ? 'active' : ''}`}
            onClick={() => setActiveTab('itemSchemes')}
          >
            Схемы предметов
          </button>
          <button
            className={`tab-button ${activeTab === 'bodies' ? 'active' : ''}`}
            onClick={() => setActiveTab('bodies')}
          >
            Тела персонажей
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'skillGroups' && <SkillGroupTab ruleId={ruleId} />}
          {activeTab === 'skills' && <SkillsTab ruleId={ruleId} />}
          {activeTab === 'itemSchemes' && <GameItemSchemeTab ruleId={ruleId} />}
          {activeTab === 'bodies' && <BodiesTab ruleId={ruleId} />}
        </div>
      </div>
    </div>
  );
};

export default RuleDetails;
