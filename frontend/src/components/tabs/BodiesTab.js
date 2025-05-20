import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Схема валидации для тела персонажа
const BodySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно')
});

// Схема валидации для добавления характеристики
const StatSchema = Yup.object().shape({
  skill_id: Yup.number()
    .required('Выберите навык'),
  init_value: Yup.number()
    .required('Укажите начальное значение')
    .min(0, 'Значение должно быть положительным'),
  value: Yup.number()
    .required('Укажите текущее значение')
    .min(0, 'Значение должно быть положительным')
});

const BodiesTab = ({ ruleId }) => {
  const [bodies, setBodies] = useState([]);
  const [selectedBody, setSelectedBody] = useState(null);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    img: null,
    icon: null,
    rules_id: ruleId
  });
  const [statInitialValues, setStatInitialValues] = useState({
    skill_id: '',
    init_value: 0,
    value: 0
  });

  // Загрузка тел персонажей
  const fetchBodies = async () => {
    try {
      const response = await axios.get(`/api/bodies/?rules_id=${ruleId}`);
      setBodies(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке тел персонажей:', err);
      setError('Не удалось загрузить тела персонажей');
      setIsLoading(false);
    }
  };

  // Загрузка навыков для правила
  const fetchSkills = async () => {
    try {
      // Сначала получаем все группы навыков для правила
      const groupsResponse = await axios.get(`/api/skill-groups/?rules_id=${ruleId}`);
      const skillGroups = groupsResponse.data;
      
      // Затем для каждой группы получаем навыки
      let allSkills = [];
      for (const group of skillGroups) {
        const skillsResponse = await axios.get(`/api/skills/?group_id=${group.id}`);
        // Добавляем информацию о группе к каждому навыку для отображения
        const skillsWithGroup = skillsResponse.data.map(skill => ({
          ...skill,
          group_name: group.name
        }));
        allSkills = [...allSkills, ...skillsWithGroup];
      }
      
      setSkills(allSkills);
    } catch (err) {
      console.error('Ошибка при загрузке навыков:', err);
      setError('Не удалось загрузить список навыков');
    }
  };

  // Загрузка характеристик для тела
  const fetchStats = async (bodyId) => {
    if (!bodyId) return;
    
    try {
      const response = await axios.get(`/api/stats/?body_id=${bodyId}`);
      setStats(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке характеристик:', err);
      setError('Не удалось загрузить характеристики');
    }
  };

  useEffect(() => {
    fetchBodies();
    fetchSkills();
  }, [ruleId]);

  const handleImageChange = (event, setFieldValue, type) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue(type, file);
      
      // Создаем превью файла
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'img') {
          setImgPreview(reader.result);
        } else if (type === 'icon') {
          setIconPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      // Создаем FormData для отправки файлов
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('rules_id', ruleId);
      
      if (values.img) {
        formData.append('img', values.img);
      }
      
      if (values.icon) {
        formData.append('icon', values.icon);
      }
      
      let newBodyId;
      
      if (editId) {
        await axios.put(`/api/bodies/${editId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        newBodyId = editId;
        setEditId(null);
      } else {
        const response = await axios.post('/api/bodies/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        newBodyId = response.data.id;
      }
      
      resetForm();
      setImgPreview(null);
      setIconPreview(null);
      await fetchBodies();
      
      // Автоматически выбираем созданное или отредактированное тело
      if (newBodyId) {
        const body = bodies.find(b => b.id === newBodyId) || (await axios.get(`/api/bodies/${newBodyId}`)).data;
        setSelectedBody(body);
        fetchStats(newBodyId);
      }
    } catch (err) {
      console.error('Ошибка при сохранении тела персонажа:', err);
      setError('Не удалось сохранить тело персонажа');
    }
  };

  const handleEdit = (body) => {
    setEditId(body.id);
    setInitialValues({
      name: body.name,
      img: null, // Файлы нельзя предзаполнить, только отображаем превью
      icon: null,
      rules_id: ruleId
    });
    
    // Устанавливаем превью изображений если они есть
    if (body.img) {
      setImgPreview(body.img);
    }
    
    if (body.icon) {
      setIconPreview(body.icon);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это тело персонажа?')) {
      try {
        await axios.delete(`/api/bodies/${id}`);
        
        // Если удаленное тело было выбрано, сбрасываем выбор
        if (selectedBody && selectedBody.id === id) {
          setSelectedBody(null);
          setStats([]);
        }
        
        fetchBodies();
      } catch (err) {
        console.error('Ошибка при удалении тела персонажа:', err);
        setError('Не удалось удалить тело персонажа');
      }
    }
  };

  // Выбор тела для редактирования его характеристик
  const handleSelectBody = (body) => {
    setSelectedBody(body);
    fetchStats(body.id);
  };

  // Добавление характеристики
  const handleAddStat = async (values, { resetForm }) => {
    if (!selectedBody) return;
    
    try {
      // Проверяем, нет ли уже такого навыка у тела
      const existingStat = stats.find(stat => stat.skill_id === parseInt(values.skill_id));
      
      if (existingStat) {
        setError('Этот навык уже добавлен к телу персонажа');
        return;
      }
      
      const statData = {
        body_id: selectedBody.id,
        skill_id: parseInt(values.skill_id),
        init_value: parseInt(values.init_value),
        value: parseInt(values.value)
      };
      
      await axios.post('/api/stats/', statData);
      resetForm();
      fetchStats(selectedBody.id);
    } catch (err) {
      console.error('Ошибка при добавлении характеристики:', err);
      setError('Не удалось добавить характеристику');
    }
  };

  // Удаление характеристики
  const handleDeleteStat = async (statId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту характеристику?')) {
      try {
        await axios.delete(`/api/stats/${statId}`);
        fetchStats(selectedBody.id);
      } catch (err) {
        console.error('Ошибка при удалении характеристики:', err);
        setError('Не удалось удалить характеристику');
      }
    }
  };

  // Редактирование характеристики
  const handleEditStat = async (statId, values) => {
    try {
      await axios.put(`/api/stats/${statId}`, {
        init_value: parseInt(values.init_value),
        value: parseInt(values.value),
        body_id: selectedBody.id,
        skill_id: parseInt(values.skill_id)
      });
      fetchStats(selectedBody.id);
    } catch (err) {
      console.error('Ошибка при обновлении характеристики:', err);
      setError('Не удалось обновить характеристику');
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка тел персонажей...</div>;
  }

  return (
    <div className="bodies-tab">
      <div className="bodies-grid">
        <div className="body-form-container">
          <h3>{editId ? 'Редактирование тела персонажа' : 'Добавление нового тела персонажа'}</h3>
          <Formik
            initialValues={initialValues}
            validationSchema={BodySchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Название тела персонажа *</label>
                  <Field type="text" id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="img">Изображение</label>
                  <input
                    type="file"
                    id="img"
                    name="img"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setFieldValue, 'img')}
                    className="form-control"
                  />
                  {imgPreview && (
                    <div className="image-preview">
                      <img src={imgPreview} alt="Превью изображения" className="preview-image" />
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="icon">Иконка</label>
                  <input
                    type="file"
                    id="icon"
                    name="icon"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, setFieldValue, 'icon')}
                    className="form-control"
                  />
                  {iconPreview && (
                    <div className="icon-preview">
                      <img src={iconPreview} alt="Превью иконки" className="preview-icon" />
                    </div>
                  )}
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
                        setImgPreview(null);
                        setIconPreview(null);
                        setInitialValues({ name: '', img: null, icon: null, rules_id: ruleId });
                      }}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>

          <div className="bodies-list">
            <h3>Список тел персонажей</h3>
            {bodies.length === 0 ? (
              <p>Тела персонажей не найдены. Создайте новое тело персонажа.</p>
            ) : (
              <div className="bodies-grid-list">
                {bodies.map(body => (
                  <div 
                    key={body.id} 
                    className={`body-card ${selectedBody && selectedBody.id === body.id ? 'selected' : ''}`}
                    onClick={() => handleSelectBody(body)}
                  >
                    <h4>{body.name}</h4>
                    {body.icon && (
                      <img src={body.icon} alt={`Иконка для ${body.name}`} className="table-thumbnail" />
                    )}
                    <div className="body-card-actions">
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(body);
                        }}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(body.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedBody && (
          <div className="stats-container">
            <h3>Характеристики для тела: {selectedBody.name}</h3>
            
            <div className="stat-form">
              <h4>Добавить характеристику</h4>
              <Formik
                initialValues={statInitialValues}
                validationSchema={StatSchema}
                onSubmit={handleAddStat}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="form-group">
                      <label htmlFor="skill_id">Навык *</label>
                      <Field as="select" id="skill_id" name="skill_id" className="form-control">
                        <option value="">Выберите навык</option>
                        {skills.map(skill => (
                          <option
                            key={skill.id}
                            value={skill.id}
                            disabled={stats.some(stat => stat.skill_id === skill.id)}
                          >
                            {skill.group_name}: {skill.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="skill_id" component="div" className="error-message" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="init_value">Начальное значение *</label>
                      <Field type="number" id="init_value" name="init_value" className="form-control" />
                      <ErrorMessage name="init_value" component="div" className="error-message" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="value">Текущее значение *</label>
                      <Field type="number" id="value" name="value" className="form-control" />
                      <ErrorMessage name="value" component="div" className="error-message" />
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Добавление...' : 'Добавить характеристику'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
            
            <div className="stats-list">
              <h4>Текущие характеристики</h4>
              {stats.length === 0 ? (
                <p>Характеристики не найдены. Добавьте новую характеристику.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Навык</th>
                      <th>Группа</th>
                      <th>Начальное значение</th>
                      <th>Текущее значение</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(stat => {
                      // Находим навык по ID для отображения имени
                      const skill = skills.find(s => s.id === stat.skill_id) || { name: 'Неизвестный навык', group_name: 'Неизвестная группа' };
                      
                      return (
                        <tr key={stat.id}>
                          <td>{skill.name}</td>
                          <td>{skill.group_name}</td>
                          <td>
                            <input
                              type="number"
                              className="inline-edit"
                              defaultValue={stat.init_value}
                              onBlur={(e) => {
                                if (e.target.value !== String(stat.init_value)) {
                                  handleEditStat(stat.id, {
                                    ...stat,
                                    init_value: parseInt(e.target.value)
                                  });
                                }
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="inline-edit"
                              defaultValue={stat.value}
                              onBlur={(e) => {
                                if (e.target.value !== String(stat.value)) {
                                  handleEditStat(stat.id, {
                                    ...stat,
                                    value: parseInt(e.target.value)
                                  });
                                }
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-delete"
                              onClick={() => handleDeleteStat(stat.id)}
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
        )}
      </div>

      {error && <div className="error-notification">{error}</div>}
      
      <style jsx>{`
        .bodies-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .body-form-container {
          padding-right: 20px;
        }
        
        .bodies-grid-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .body-card {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          background-color: #f9f9f9;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .body-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .body-card.selected {
          border: 2px solid #3498db;
          background-color: #ebf5fb;
        }
        
        .table-thumbnail {
          max-width: 50px;
          max-height: 50px;
          border-radius: 4px;
        }
        
        .body-card-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        
        .stats-container {
          border-left: 1px solid #ddd;
          padding-left: 20px;
        }
        
        .inline-edit {
          width: 60px;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .error-notification {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 10px;
          margin-top: 20px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default BodiesTab;
