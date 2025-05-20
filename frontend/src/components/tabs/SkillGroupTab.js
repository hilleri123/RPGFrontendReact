import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Схема валидации для группы навыков
const SkillGroupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно')
});

const SkillGroupTab = ({ ruleId }) => {
  const [skillGroups, setSkillGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    rules_id: ruleId
  });

  const fetchSkillGroups = async () => {
    try {
      const response = await axios.get(`/api/skill-groups/?rules_id=${ruleId}`);
      setSkillGroups(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке групп навыков:', err);
      setError('Не удалось загрузить группы навыков');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillGroups();
  }, [ruleId]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (editId) {
        await axios.put(`/api/skill-groups/${editId}`, values);
        setEditId(null);
      } else {
        await axios.post('/api/skill-groups/', values);
      }
      resetForm();
      fetchSkillGroups();
    } catch (err) {
      console.error('Ошибка при сохранении группы навыков:', err);
      setError('Не удалось сохранить группу навыков');
    }
  };

  const handleEdit = (skillGroup) => {
    setEditId(skillGroup.id);
    setInitialValues({
      name: skillGroup.name,
      rules_id: ruleId
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту группу навыков?')) {
      try {
        await axios.delete(`/api/skill-groups/${id}`);
        fetchSkillGroups();
      } catch (err) {
        console.error('Ошибка при удалении группы навыков:', err);
        setError('Не удалось удалить группу навыков');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка групп навыков...</div>;
  }

  return (
    <div className="skill-group-tab">
      <div className="skill-group-form">
        <h3>{editId ? 'Редактирование группы навыков' : 'Добавление новой группы навыков'}</h3>
        <Formik
          initialValues={initialValues}
          validationSchema={SkillGroupSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="form-group">
                <label htmlFor="name">Название группы навыков *</label>
                <Field type="text" id="name" name="name" className="form-control" />
                <ErrorMessage name="name" component="div" className="error-message" />
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
                      setInitialValues({ name: '', rules_id: ruleId });
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

      <div className="skill-group-list">
        <h3>Список групп навыков</h3>
        {skillGroups.length === 0 ? (
          <p>Группы навыков не найдены. Создайте новую группу.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {skillGroups.map(group => (
                <tr key={group.id}>
                  <td>{group.id}</td>
                  <td>{group.name}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(group)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(group.id)}
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

export default SkillGroupTab;
