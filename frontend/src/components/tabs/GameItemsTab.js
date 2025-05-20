import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const GameItemSchema = Yup.object().shape({
  unique_name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  item_scheme_id: Yup.number()
    .required('Схема предмета обязательна'),
});

const GameItemsTab = ({ scenarioId }) => {
  const [gameItems, setGameItems] = useState([]);
  const [gameItemSchemes, setGameItemSchemes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [npcs, setNPCs] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    unique_name: '',
    item_scheme_id: '',
    location_id: '',
    npc_id: '',
    player_id: '',
    scenario_id: scenarioId
  });

  // Загружаем все необходимые данные
  const fetchData = async () => {
    try {
      // Загружаем предметы для данного сценария
      const itemsResponse = await axios.get(`/api/game-items/?scenario_id=${scenarioId}`);
      setGameItems(itemsResponse.data);
      
      // Загружаем все доступные схемы предметов
      const schemesResponse = await axios.get('/api/game-item-schemes/');
      setGameItemSchemes(schemesResponse.data);
      
      // Загружаем локации для данного сценария
      const locationsResponse = await axios.get(`/api/locations/?scenario_id=${scenarioId}`);
      setLocations(locationsResponse.data);
      
      // Загружаем NPC для данного сценария
      const npcsResponse = await axios.get(`/api/npcs/?scenario_id=${scenarioId}`);
      setNPCs(npcsResponse.data);
      
      // Загружаем персонажей для данного сценария
      const charactersResponse = await axios.get(`/api/player-characters/?scenario_id=${scenarioId}`);
      setCharacters(charactersResponse.data);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err);
      setError('Не удалось загрузить данные');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scenarioId]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Создаем игровой предмет
      const itemData = {
        unique_name: values.unique_name,
        item_scheme_id: parseInt(values.item_scheme_id)
      };
      
      let itemId;
      
      if (editId) {
        await axios.put(`/api/game-items/${editId}`, itemData);
        itemId = editId;
        // Удаляем существующие "where objects" для этого предмета
        await axios.delete(`/api/where-objects/by-item/${itemId}`);
      } else {
        const response = await axios.post('/api/game-items/', itemData);
        itemId = response.data.id;
      }
      
      // Создаем "where object" для определения местоположения предмета
      if (values.location_id || values.npc_id || values.player_id) {
        const whereData = {
          game_item_id: itemId,
          location_id: values.location_id ? parseInt(values.location_id) : null,
          npc_id: values.npc_id ? parseInt(values.npc_id) : null,
          player_id: values.player_id ? parseInt(values.player_id) : null
        };
        
        await axios.post('/api/where-objects/', whereData);
      }
      
      resetForm();
      fetchData();
      setEditId(null);
    } catch (err) {
      console.error('Ошибка при сохранении игрового предмета:', err);
      setError('Не удалось сохранить игровой предмет');
    }
  };

  const handleEdit = async (item) => {
    try {
      // Получаем информацию о местоположении предмета
      const whereResponse = await axios.get(`/api/where-objects/by-item/${item.id}`);
      const whereObject = whereResponse.data.length > 0 ? whereResponse.data[0] : null;
      
      setEditId(item.id);
      setInitialValues({
        unique_name: item.unique_name,
        item_scheme_id: item.item_scheme_id,
        location_id: whereObject?.location_id || '',
        npc_id: whereObject?.npc_id || '',
        player_id: whereObject?.player_id || '',
        scenario_id: scenarioId
      });
    } catch (err) {
      console.error('Ошибка при загрузке данных предмета:', err);
      setError('Не удалось загрузить данные предмета');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот игровой предмет?')) {
      try {
        // Удаляем "where objects" для этого предмета
        await axios.delete(`/api/where-objects/by-item/${id}`);
        // Удаляем сам предмет
        await axios.delete(`/api/game-items/${id}`);
        fetchData();
      } catch (err) {
        console.error('Ошибка при удалении игрового предмета:', err);
        setError('Не удалось удалить игровой предмет');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="game-items-tab">
      <div className="item-form">
        <h3>{editId ? 'Редактирование игрового предмета' : 'Добавление нового игрового предмета'}</h3>
        
        {gameItemSchemes.length === 0 ? (
          <div className="alert alert-warning">
            Сначала создайте схемы предметов в разделе "Правила" -&gt; "Схемы предметов"
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={GameItemSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="unique_name">Название предмета *</label>
                  <Field type="text" id="unique_name" name="unique_name" className="form-control" />
                  <ErrorMessage name="unique_name" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="item_scheme_id">Схема предмета *</label>
                  <Field as="select" id="item_scheme_id" name="item_scheme_id" className="form-control">
                    <option value="">Выберите схему предмета</option>
                    {gameItemSchemes.map(scheme => (
                      <option key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="item_scheme_id" component="div" className="error-message" />
                </div>
                
                <div className="location-form-header">
                  <h4>Местоположение предмета</h4>
                  <p className="form-text text-muted">Выберите один из трех вариантов местоположения</p>
                </div>
                
                <div className="form-group">
                  <label htmlFor="location_id">В локации</label>
                  <Field as="select" id="location_id" name="location_id" className="form-control">
                    <option value="">Не в локации</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </Field>
                </div>
                
                <div className="form-group">
                  <label htmlFor="npc_id">У NPC</label>
                  <Field as="select" id="npc_id" name="npc_id" className="form-control">
                    <option value="">Не у NPC</option>
                    {npcs.map(npc => (
                      <option key={npc.id} value={npc.id}>
                        {npc.name}
                      </option>
                    ))}
                  </Field>
                </div>
                
                <div className="form-group">
                  <label htmlFor="player_id">У персонажа игрока</label>
                  <Field as="select" id="player_id" name="player_id" className="form-control">
                    <option value="">Не у персонажа</option>
                    {characters.map(character => (
                      <option key={character.id} value={character.id}>
                        {character.name}
                      </option>
                    ))}
                  </Field>
                </div>
                
                <Field type="hidden" name="scenario_id" />
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : (editId ? 'Обновить' : 'Добавить')}
                  </button>
                  {editId && (
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setEditId(null);
                        setInitialValues({
                          unique_name: '',
                          item_scheme_id: '',
                          location_id: '',
                          npc_id: '',
                          player_id: '',
                          scenario_id: scenarioId
                        });
                      }}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>

      <div className="items-list">
        <h3>Список игровых предметов</h3>
        {gameItems.length === 0 ? (
          <p>Игровые предметы не найдены. Создайте новый предмет.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Схема</th>
                <th>Местоположение</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {gameItems.map(item => {
                // Находим схему предмета для отображения
                const scheme = gameItemSchemes.find(s => s.id === item.item_scheme_id);
                
                // Определяем местоположение предмета (это потребует дополнительного запроса в реальном приложении)
                // Здесь предполагаем, что у нас уже есть информация о местоположении
                let locationInfo = "Неизвестно";
                
                // В реальном коде нужно будет получать эту информацию из API
                
                return (
                  <tr key={item.id}>
                    <td>{item.unique_name}</td>
                    <td>{scheme ? scheme.name : 'Неизвестная схема'}</td>
                    <td>{locationInfo}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(item)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GameItemsTab;
