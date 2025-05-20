import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const LocationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  description: Yup.string()
    .max(1000, 'Описание слишком длинное'),
  parent_location_id: Yup.number().nullable(),
});

const LocationsTab = ({ scenarioId }) => {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    description: '',
    file: null,
    parent_location_id: '',
    scenario_id: scenarioId
  });

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`/api/locations/?scenario_id=${scenarioId}`);
      setLocations(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке локаций:', err);
      setError('Не удалось загрузить локации');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [scenarioId]);

  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue('file', file);
      
      // Создаем превью файла
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('scenario_id', scenarioId);
      
      if (values.parent_location_id) {
        formData.append('parent_location_id', values.parent_location_id);
      }
      
      if (values.file) {
        formData.append('file', values.file);
      }
      
      if (editId) {
        await axios.put(`/api/locations/${editId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setEditId(null);
      } else {
        await axios.post('/api/locations/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      resetForm();
      setFilePreview(null);
      fetchLocations();
    } catch (err) {
      console.error('Ошибка при сохранении локации:', err);
      setError('Не удалось сохранить локацию');
    }
  };

  const handleEdit = (location) => {
    setEditId(location.id);
    setInitialValues({
      name: location.name,
      description: location.description || '',
      file: null,
      parent_location_id: location.parent_location_id || '',
      scenario_id: scenarioId
    });
    
    if (location.file) {
      setFilePreview(location.file);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту локацию?')) {
      try {
        await axios.delete(`/api/locations/${id}`);
        fetchLocations();
      } catch (err) {
        console.error('Ошибка при удалении локации:', err);
        setError('Не удалось удалить локацию');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка локаций...</div>;
  }

  return (
    <div className="locations-tab">
      <div className="location-form">
        <h3>{editId ? 'Редактирование локации' : 'Добавление новой локации'}</h3>
        <Formik
          initialValues={initialValues}
          validationSchema={LocationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="name">Название локации *</label>
                <Field type="text" id="name" name="name" className="form-control" />
                <ErrorMessage name="name" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Описание</label>
                <Field as="textarea" id="description" name="description" className="form-control" />
                <ErrorMessage name="description" component="div" className="error-message" />
              </div>
              
              <div className="form-group">
                <label htmlFor="file">Файл карты</label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setFieldValue)}
                  className="form-control"
                />
                {filePreview && (
                  <div className="file-preview">
                    <img src={filePreview} alt="Превью карты" className="preview-image" />
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="parent_location_id">Родительская локация</label>
                <Field as="select" id="parent_location_id" name="parent_location_id" className="form-control">
                  <option value="">Нет родительской локации</option>
                  {locations.map(location => (
                    <option 
                      key={location.id} 
                      value={location.id}
                      disabled={location.id === editId} // Нельзя выбрать себя как родителя
                    >
                      {location.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="parent_location_id" component="div" className="error-message" />
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
                      setFilePreview(null);
                      setInitialValues({
                        name: '',
                        description: '',
                        file: null,
                        parent_location_id: '',
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
      </div>

      <div className="locations-list">
        <h3>Список локаций</h3>
        {locations.length === 0 ? (
          <p>Локации не найдены. Создайте новую локацию.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Родительская локация</th>
                <th>Карта</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(location => {
                // Находим родительскую локацию для отображения имени
                const parentLocation = locations.find(l => l.id === location.parent_location_id);
                
                return (
                  <tr key={location.id}>
                    <td>{location.name}</td>
                    <td>{location.description ? location.description.substring(0, 50) + (location.description.length > 50 ? '...' : '') : ''}</td>
                    <td>{parentLocation ? parentLocation.name : ''}</td>
                    <td>
                      {location.file && (
                        <img src={location.file} alt={`Карта для ${location.name}`} className="table-thumbnail" />
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(location)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(location.id)}
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

export default LocationsTab;
