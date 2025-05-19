import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState({
    name: '',
    intro: '',
    icon: '',
    max_players: 4,
    rules_id: null,
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
          setInitialValues(response.data);
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

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      if (id) {
        // Обновление существующего сценария
        await axios.put(`/api/scenarios/${id}`, values);
      } else {
        // Создание нового сценария
        await axios.post('/api/scenarios/', values);
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
        {({ isSubmitting }) => (
          <Form className="scenario-form">
            <div className="form-group">
              <label htmlFor="name">Название сценария *</label>
              <Field type="text" id="name" name="name" className="form-control" />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="intro">Вступление</label>
              <Field as="textarea" id="intro" name="intro" className="form-control" />
              <ErrorMessage name="intro" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="icon">URL иконки</label>
              <Field type="text" id="icon" name="icon" className="form-control" />
            </div>

            <div className="form-group">
              <label htmlFor="max_players">Максимум игроков</label>
              <Field type="number" id="max_players" name="max_players" className="form-control" />
              <ErrorMessage name="max_players" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="rules_id">Правила</label>
              <Field as="select" id="rules_id" name="rules_id" className="form-control">
                <option value="">Выберите правила</option>
                {rules.map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </Field>
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
