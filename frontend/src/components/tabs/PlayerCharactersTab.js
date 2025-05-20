import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const PlayerCharacterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое имя')
    .max(50, 'Слишком длинное имя')
    .required('Имя обязательно'),
  short_desc: Yup.string()
    .max(200, 'Краткое описание слишком длинное'),
  story: Yup.string()
    .max(2000, 'История слишком длинная'),
  body_id: Yup.number()
    .required('Тело персонажа обязательно'),
  location_id: Yup.number()
    .nullable(),
});

const PlayerCharactersTab = ({ scenarioId }) => {
  const [characters, setCharacters] = useState([]);
  const [bodies, setBodies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    short_desc: '',
    story: '',
    body_id: '',
    location_id: '',
    scenario_id: scenarioId
  });

  // Загружаем персонажей, тела и локации
  const fetchData = async () => {
    try {
      // Загружаем персонажей для данного сценария
      const charactersResponse = await axios.get(`/api/player-characters/?scenario_id=${scenarioId}`);
      setCharacters(charactersResponse.data);
      
      // Загружаем все доступные тела персонажей
      const bodiesResponse = await axios.get('/api/bodies/');
      setBodies(bodiesResponse.data);
      
      // Загружаем локации для данного сценария
      const locationsResponse = await axios.get(`/api/locations/?scenario_id=${scenarioId}`);
      setLocations(locationsResponse.data);
      
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
      const formData = {
        ...values,
        body_id: parseInt(values.body_id),
        location_id: values.location_id ? parseInt(values.location_id) : null
      };
      
      if (editId) {
        await axios.put(`/api/player-characters/${editId}`, formData);
        setEditId(null);
      } else {
        await axios.post('/api/player-characters/', formData);
      }
      
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Ошибка при сохранении персонажа:', err);
      setError('Не удалось сохранить персонажа');
    }
  };

  const handleEdit = (character) => {
    setEditId(character.id);
    setInitialValues({
      name: character.name,
      short_desc: character.short_desc || '',
      story: character.story || '',
      body_id: character.body_id,
      location_id: character.location_id || '',
      scenario_id: scenarioId
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого персонажа?')) {
      try {
        await axios.delete(`/api/player-characters/${id}`);
        fetchData();
      } catch (err) {
        console.error('Ошибка при удалении персонажа:', err);
        setError('Не удалось удалить персонажа');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="player-characters-tab">
      <div className="character-form">
        <h3>{editId ? 'Редактирование персонажа' : 'Добавление нового персонажа'}</h3>
        
        {bodies.length === 0 ? (
          <div className="alert alert-warning">
            Сначала создайте тела персонажей в разделе "Правила" -&gt; "Тела персонажей"
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={PlayerCharacterSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Имя персонажа *</label>
                  <Field type="text" id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="short_desc">Краткое описание</label>
                  <Field as="textarea" id="short_desc" name="short_desc" className="form-control" rows="2" />
                  <ErrorMessage name="short_desc" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="story">История</label>
                  <Field as="textarea" id="story" name="story" className="form-control" rows="5" />
                  <ErrorMessage name="story" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="body_id">Тело персонажа *</label>
                  <Field as="select" id="body_id" name="body_id" className="form-control">
                    <option value="">Выберите тело персонажа</option>
                    {bodies.map(body => (
                      <option key={body.id} value={body.id}>
                        {body.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="body_id" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location_id">Начальная локация</label>
                  <Field as="select" id="location_id" name="location_id" className="form-control">
                    <option value="">Выберите локацию</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="location_id" component="div" className="error-message" />
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
                          name: '',
                          short_desc: '',
                          story: '',
                          body_id: '',
                          location_id: '',
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

      <div className="characters-list">
        <h3>Список персонажей</h3>
        {characters.length === 0 ? (
          <p>Персонажи не найдены. Создайте нового персонажа.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Тело</th>
                <th>Локация</th>
                <th>Краткое описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(character => {
                // Находим тело и локацию для отображения
                const body = bodies.find(b => b.id === character.body_id);
                const location = locations.find(l => l.id === character.location_id);
                
                return (
                  <tr key={character.id}>
                    <td>{character.name}</td>
                    <td>
                      <div className="body-info">
                        {body && body.icon && <img src={body.icon} alt={body.name} className="body-icon" />}
                        {body ? body.name : 'Неизвестное тело'}
                      </div>
                    </td>
                    <td>{location ? location.name : 'Не указана'}</td>
                    <td>{character.short_desc ? character.short_desc.substring(0, 50) + (character.short_desc.length > 50 ? '...' : '') : ''}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(character)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(character.id)}
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

export default PlayerCharactersTab;
