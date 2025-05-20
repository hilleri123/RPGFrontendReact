import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Схема валидации для схемы предмета
const GameItemSchemeSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  text: Yup.string()
    .max(500, 'Слишком длинное описание'),
  data: Yup.string()
    .nullable()
});

const GameItemSchemeTab = ({ ruleId }) => {
  const [gameItemSchemes, setGameItemSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    text: '',
    data: '',
    rules_id: ruleId
  });

  const fetchGameItemSchemes = async () => {
    try {
      const response = await axios.get(`/api/game-item-schemes/?rules_id=${ruleId}`);
      setGameItemSchemes(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке схем предметов:', err);
      setError('Не удалось загрузить схемы предметов');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGameItemSchemes();
  }, [ruleId]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Преобразуем строку JSON в объект, если она указана
      let dataValue = values.data;
      if (dataValue) {
        try {
          dataValue = JSON.parse(dataValue);
        } catch (e) {
          setError('Неверный формат JSON для поля data');
          return;
        }
      }

      const submitData = {
        ...values,
        data: dataValue,
      };

      if (editId) {
        await axios.put(`/api/game-item-schemes/${editId}`, submitData);
        setEditId(null);
      } else {
        await axios.post('/api/game-item-schemes/', submitData);
      }
      resetForm();
      fetchGameItemSchemes();
    } catch (err) {
      console.error('Ошибка при сохранении схемы предмета:', err);
      setError('Не удалось сохранить схему предмета');
    }
  };

  const handleEdit = (scheme) => {
    setEditId(scheme.id);
    setInitialValues({
      name: scheme.name,
      text: scheme.text || '',
      data: scheme.data ? JSON.stringify(scheme.data, null, 2) : '',
      rules_id: ruleId
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту схему предмета?')) {
      try {
        await axios.delete(`/api/game-item-schemes/${id}`);
        fetchGameItemSchemes();
      } catch (err) {
        console.error('Ошибка при удалении схемы предмета:', err);
        setError('Не удалось удалить схему предмета');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка схем предметов...</div>;
  }

  return (
    <div className="game-item-scheme-tab">
      <div className="game-item-scheme-form">
        <h3>{editId ? 'Редактирование схемы предмета' : 'Добавление новой схемы предмета'}</h3>
        <Formik
          initialValues={initialValues}
          validationSchema={GameItemSchemeSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="name">Название схемы предмета *</label>
                <Field type="text" id="name" name="name" className="form-control" />
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="text">Описание</label>
                <Field as="textarea" id="text" name="text" className="form-control" />
                <ErrorMessage name="text" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="data">Данные (JSON)</label>
                <Field as="textarea" id="data" name="data" className="form-control code-editor" />
                <ErrorMessage name="data" component="div" className="error-message" />
                <small className="form-text text-muted">Введите данные в формате JSON</small>
              </div>
              
              <Field type="hidden" name="rules_id" />
              
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
                      setInitialValues({ name: '', text: '', data: '', rules_id: ruleId });
                    }}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div className="game-item-scheme-list">
        <h3>Список схем предметов</h3>
        {gameItemSchemes.length === 0 ? (
          <p>Схемы предметов не найдены. Создайте новую схему.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {gameItemSchemes.map(scheme => (
                <tr key={scheme.id}>
                  <td>{scheme.id}</td>
                  <td>{scheme.name}</td>
                  <td>{scheme.text ? scheme.text.substring(0, 50) + (scheme.text.length > 50 ? '...' : '') : ''}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(scheme)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(scheme.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GameItemSchemeTab;
