import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ScenarioSelector = () => {
  const [scenarios, setScenarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await axios.get('/api/scenarios/');
        setScenarios(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке сценариев:', err);
        setError('Не удалось загрузить список сценариев');
        setIsLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  if (isLoading) {
    return <div className="loading">Загрузка сценариев...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="scenario-selector">
      <h2>Выберите сценарий для управления связанными элементами</h2>
      <div className="scenarios-grid">
        {scenarios.length === 0 ? (
          <p>Сценарии не найдены. Создайте новый сценарий.</p>
        ) : (
          scenarios.map(scenario => (
            <div key={scenario.id} className="scenario-card">
              <h3>{scenario.name}</h3>
              {scenario.icon && (
                <img 
                  src={scenario.icon} 
                  alt={`Иконка для ${scenario.name}`} 
                  className="scenario-icon" 
                />
              )}
              <p>{scenario.intro ? scenario.intro.substring(0, 100) + '...' : 'Нет описания'}</p>
              <div className="scenario-actions">
                <Link to={`/scenarios/${scenario.id}/details`} className="btn btn-primary">
                  Управление элементами
                </Link>
                <Link to={`/scenarios/edit/${scenario.id}`} className="btn btn-edit">
                  Редактировать
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="add-scenario-button">
        <Link to="/scenarios/new" className="btn btn-add">
          Создать новый сценарий
        </Link>
      </div>
    </div>
  );
};

export default ScenarioSelector;
