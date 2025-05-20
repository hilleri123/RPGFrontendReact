import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const NPCSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое имя')
    .max(50, 'Слишком длинное имя')
    .required('Имя обязательно'),
  story: Yup.string()
    .max(2000, 'История слишком длинная'),
  body_id: Yup.number()
    .required('Тело персонажа обязательно'),
});

const NPCsTab = ({ scenarioId }) => {
  const [npcs, setNPCs] = useState([]);
  const [bodies, setBodies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    story: '',
    body_id: '',
    scenario_id: scenarioId
  });

  // Загружаем NPC и тела персонажей
  const fetchData = async () => {
    try {
      // Загружаем NPC для данного сценария
      const npcsResponse = await axios.get(`/api/npcs/?scenario_id=${scenarioId}`);
      setNPCs(npcsResponse.data);
      
      // Загружаем все доступные тела персонажей
      const bodiesResponse = await axios.get('/api/bodies/');
      setBodies(bodiesResponse.data);
      
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
      if (editId) {
        await axios.put(`/api/npcs/${editId}`, {
          ...values,
          body_id: parseInt(values.body_id)
        });
        setEditId(null);
      } else {
        await axios.post('/api/npcs/', {
          ...values,
          body_id: parseInt(values.body_id)
        });
      }
      
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Ошибка при сохранении NPC:', err);
      setError('Не удалось сохранить NPC');
    }
  };

  const handleEdit = (npc) => {
    setEditId(npc.id);
    setInitialValues({
      name: npc.name,
      story: npc.story || '',
      body_id: npc.body_id,
      scenario_id: scenarioId
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этого NPC?')) {
      try {
        await axios.delete(`/api/npcs/${id}`);
        fetchData();
      } catch (err) {
        console.error('Ошибка при удалении NPC:', err);
        setError('Не удалось удалить NPC');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка данных...</div>;
  }

  return (
    <div className="npcs-tab">
      <div className="npc-form">
        <h3>{editId ? 'Редактирование NPC' : 'Добавление нового NPC'}</h3>
        
        {bodies.length === 0 ? (
          <div className="alert alert-warning">
            Сначала создайте тела персонажей в разделе "Правила" -&gt; "Тела персонажей"
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={NPCSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Имя NPC *</label>
                  <Field type="text" id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="error-message" />
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
                          story: '',
                          body_id: '',
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

      <div className="npcs-list">
        <h3>Список NPC</h3>
        {npcs.length === 0 ? (
          <p>NPC не найдены. Создайте нового NPC.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Тело</th>
                <th>История</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {npcs.map(npc => {
                // Находим тело персонажа для отображения
                const body = bodies.find(b => b.id === npc.body_id);
                
                return (
                  <tr key={npc.id}>
                    <td>{npc.name}</td>
                    <td>
                      <div className="body-info">
                        {body && body.icon && <img src={body.icon} alt={body.name} className="body-icon" />}
                        {body ? body.name : 'Неизвестное тело'}
                      </div>
                    </td>
                    <td>{npc.story ? npc.story.substring(0, 50) + (npc.story.length > 50 ? '...' : '') : ''}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(npc)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(npc.id)}
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

export default NPCsTab;
