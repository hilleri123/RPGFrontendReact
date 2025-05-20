import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ScenarioList = () => {
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

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот сценарий?')) {
      try {
        await axios.delete(`/api/scenarios/${id}`);
        setScenarios(scenarios.filter(scenario => scenario.id !== id));
      } catch (err) {
        console.error('Ошибка при удалении сценария:', err);
        setError('Не удалось удалить сценарий');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="scenario-list-container">
      <h2>Список сценариев</h2>
      {scenarios.length === 0 ? (
        <p>Сценарии не найдены. Создайте новый сценарий!</p>
      ) : (
        <div className="scenario-grid">
          {scenarios.map(scenario => (
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
              <p>Игроков: {scenario.max_players || 'Не указано'}</p>
              <div className="scenario-actions">
                {/* Добавляем кнопку для перехода к деталям сценария */}
                <Link to={`/scenarios/${scenario.id}/details`} className="btn btn-primary">
                  Управление элементами
                </Link>
                <Link to={`/scenarios/edit/${scenario.id}`} className="btn btn-edit">
                  Редактировать
                </Link>
                <button 
                  onClick={() => handleDelete(scenario.id)} 
                  className="btn btn-delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="add-scenario">
        <Link to="/scenarios/new" className="btn btn-add">
          Создать новый сценарий
        </Link>
      </div>
    </div>
  );
};

export default ScenarioList;
