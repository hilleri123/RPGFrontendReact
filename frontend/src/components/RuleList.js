import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RuleList = () => {
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

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это правило?')) {
      try {
        await axios.delete(`/api/rules/${id}`);
        setRules(rules.filter(rule => rule.id !== id));
      } catch (err) {
        console.error('Ошибка при удалении правила:', err);
        setError('Не удалось удалить правило');
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
    <div className="rule-list-container">
      <h2>Список правил</h2>
      {rules.length === 0 ? (
        <p>Правила не найдены. Создайте новое правило!</p>
      ) : (
        <div className="rule-grid">
          {rules.map(rule => (
            <div key={rule.id} className="rule-card">
              <h3>{rule.name}</h3>
              <div className="rule-actions">
                <Link to={`/rules/edit/${rule.id}`} className="btn btn-edit">
                  Редактировать
                </Link>
                <button 
                  onClick={() => handleDelete(rule.id)} 
                  className="btn btn-delete"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="add-rule">
        <Link to="/rules/new" className="btn btn-add">
          Создать новое правило
        </Link>
      </div>
    </div>
  );
};

export default RuleList;
