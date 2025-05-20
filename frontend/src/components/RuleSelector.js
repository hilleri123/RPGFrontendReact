import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RuleSelector = () => {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get('/api/rules/');
        setRules(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке правил:', err);
        setError('Не удалось загрузить список правил');
        setIsLoading(false);
      }
    };

    fetchRules();
  }, []);

  if (isLoading) {
    return <div className="loading">Загрузка правил...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="rule-selector">
      <h2>Выберите правила для управления связанными элементами</h2>
      <div className="rules-grid">
        {rules.length === 0 ? (
          <p>Правила не найдены. Создайте новые правила.</p>
        ) : (
          rules.map(rule => (
            <div key={rule.id} className="rule-card">
              <h3>{rule.name}</h3>
              <div className="rule-actions">
                <Link to={`/rules/${rule.id}/details`} className="btn btn-primary">
                  Управление элементами
                </Link>
                <Link to={`/rules/edit/${rule.id}`} className="btn btn-edit">
                  Редактировать
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="add-rule-button">
        <Link to="/rules/new" className="btn btn-add">
          Создать новые правила
        </Link>
      </div>
    </div>
  );
};

export default RuleSelector;
