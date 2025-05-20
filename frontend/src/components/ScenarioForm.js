import React, { useState, useEffect } from 'react';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

// Схема валидации для формы сценария
const ScenarioSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  intro: Yup.string()
    .max(500, 'Слишком длинное вступление'),
  max_players: Yup.number()
    .positive('Число должно быть положительным')
    .integer('Число должно быть целым'),
  rules_id: Yup.number().nullable(),
});

const ScenarioForm = () => {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState({
    name: '',
    intro: '',
    max_players: 4,
    rules_id: null,
    icon: null
  });

  // Получение списка доступных правил
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get('/api/rules/');
        setRules(response.data);
      } catch (err) {
        console.error('Ошибка при загрузке правил:', err);
        setError('Не удалось загрузить список правил');
      }
    };

    fetchRules();

    // Если редактирование существующего сценария, загружаем его данные
    if (id) {
      const fetchScenario = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/scenarios/${id}`);
          setInitialValues({
            name: response.data.name,
            intro: response.data.intro || '',
            max_players: response.data.max_players || 4,
            rules_id: response.data.rules_id || null
          });
          
          // Устанавливаем превью иконки, если она есть
          if (response.data.icon) {
            setIconPreview(response.data.icon);
          }
        } catch (err) {
          console.error('Ошибка при загрузке сценария:', err);
          setError('Не удалось загрузить сценарий для редактирования');
        } finally {
          setIsLoading(false);
        }
      };

      fetchScenario();
    }
  }, [id]);

  // Обработчик изменения файла иконки
  const handleIconChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue('icon', file);
      
      // Создаем превью файла
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('name', values.name);
      if (values.intro) formData.append('intro', values.intro);
      if (values.max_players) formData.append('max_players', values.max_players);
      if (values.rules_id) formData.append('rules_id', values.rules_id);
      if (values.icon) formData.append('icon', values.icon);
  
      if (id) {
        // Обновление существующего сценария
        await axios.put(`/api/scenarios/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Создание нового сценария
        await axios.post('/api/scenarios/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      navigate('/scenarios');
    } catch (err) {
      console.error('Ошибка при сохранении сценария:', err);
      setError('Не удалось сохранить сценарий');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };
  

  if (isLoading && id) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="scenario-form-container">
      <h2>{id ? 'Редактирование сценария' : 'Создание нового сценария'}</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={ScenarioSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="scenario-form">
            <div className="form-group">
              <label htmlFor="name">Название сценария *</label>
              <input
                type="text"
                id="name"
                name="name"
                onChange={(e) => setFieldValue('name', e.target.value)}
                value={values.name}
                className="form-control"
              />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="intro">Вступление</label>
              <textarea
                id="intro"
                name="intro"
                onChange={(e) => setFieldValue('intro', e.target.value)}
                value={values.intro}
                className="form-control"
              />
              <ErrorMessage name="intro" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="icon">Иконка сценария</label>
              <input
                type="file"
                id="icon"
                name="icon"
                accept="image/*"
                onChange={(e) => handleIconChange(e, setFieldValue)}
                className="form-control"
              />
              {iconPreview && (
                <div className="icon-preview">
                  <img src={iconPreview} alt="Превью иконки" className="preview-image" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="max_players">Максимум игроков</label>
              <input
                type="number"
                id="max_players"
                name="max_players"
                onChange={(e) => setFieldValue('max_players', e.target.value)}
                value={values.max_players}
                className="form-control"
              />
              <ErrorMessage name="max_players" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="rules_id">Правила</label>
              <select
                id="rules_id"
                name="rules_id"
                onChange={(e) => setFieldValue('rules_id', e.target.value)}
                value={values.rules_id || ""}
                className="form-control"
              >
                <option value="">Выберите правила</option>
                {rules.map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate('/scenarios')}
              >
                Отмена
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default ScenarioForm;
