import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

// Схема валидации для формы правил
const RuleSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  // Для поля data нет валидации, поскольку это может быть бинарный файл
});

const RuleForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState({
    name: '',
    data: null,
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    // Если редактирование существующего правила, загружаем его данные
    if (id) {
      const fetchRule = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/rules/${id}`);
          setInitialValues({
            name: response.data.name,
            // Для data не устанавливаем значение, так как это бинарные данные
          });
        } catch (err) {
          console.error('Ошибка при загрузке правила:', err);
          setError('Не удалось загрузить правило для редактирования');
        } finally {
          setIsLoading(false);
        }
      };

      fetchRule();
    }
  }, [id]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    
    try {
      let formData = new FormData();
      formData.append('name', values.name);
      
      if (file) {
        formData.append('data', file);
      }
      
      if (id) {
        // Обновление существующего правила
        await axios.put(`/api/rules/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Создание нового правила
        await axios.post('/api/rules/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      navigate('/rules');
    } catch (err) {
      console.error('Ошибка при сохранении правила:', err);
      setError('Не удалось сохранить правило');
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
    <div className="rule-form-container">
      <h2>{id ? 'Редактирование правила' : 'Создание нового правила'}</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={RuleSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting }) => (
          <Form className="rule-form">
            <div className="form-group">
              <label htmlFor="name">Название правила *</label>
              <Field type="text" id="name" name="name" className="form-control" />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="data">Файл правил</label>
              <input 
                type="file" 
                id="data" 
                onChange={handleFileChange} 
                className="form-control" 
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate('/rules')}
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

export default RuleForm;
