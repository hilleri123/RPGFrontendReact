import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

// Схема валидации для навыка
const SkillSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Слишком короткое название')
    .max(50, 'Слишком длинное название')
    .required('Название обязательно'),
  group_id: Yup.number()
    .required('Необходимо выбрать группу навыков')
});

const SkillsTab = ({ ruleId }) => {
  const [skills, setSkills] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [initialValues, setInitialValues] = useState({
    name: '',
    group_id: ''
  });

  const fetchSkillGroups = async () => {
    try {
      const response = await axios.get(`/api/skill-groups/?rules_id=${ruleId}`);
      setSkillGroups(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке групп навыков:', err);
      setError('Не удалось загрузить группы навыков');
    }
  };

  const fetchSkills = async () => {
    try {
      // Получаем все навыки, связанные с группами навыков текущих правил
      const groupsResponse = await axios.get(`/api/skill-groups/?rules_id=${ruleId}`);
      const groups = groupsResponse.data;
      
      if (groups.length === 0) {
        setSkills([]);
        setIsLoading(false);
        return;
      }
      
      const skillsPromises = groups.map(group => 
        axios.get(`/api/skills/?group_id=${group.id}`)
      );
      
      const skillsResponses = await Promise.all(skillsPromises);
      const allSkills = skillsResponses.flatMap(response => response.data);
      
      // Дополним каждый навык информацией о его группе
      const skillsWithGroupInfo = await Promise.all(allSkills.map(async skill => {
        const group = groups.find(g => g.id === skill.group_id);
        return {
          ...skill,
          group_name: group ? group.name : 'Неизвестная группа'
        };
      }));
      
      setSkills(skillsWithGroupInfo);
      setIsLoading(false);
    } catch (err) {
      console.error('Ошибка при загрузке навыков:', err);
      setError('Не удалось загрузить навыки');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchSkillGroups();
      await fetchSkills();
    };
    
    fetchData();
  }, [ruleId]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (editId) {
        await axios.put(`/api/skills/${editId}`, values);
        setEditId(null);
      } else {
        await axios.post('/api/skills/', values);
      }
      resetForm();
      fetchSkills();
    } catch (err) {
      console.error('Ошибка при сохранении навыка:', err);
      setError('Не удалось сохранить навык');
    }
  };

  const handleEdit = (skill) => {
    setEditId(skill.id);
    setInitialValues({
      name: skill.name,
      group_id: skill.group_id
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот навык?')) {
      try {
        await axios.delete(`/api/skills/${id}`);
        fetchSkills();
      } catch (err) {
        console.error('Ошибка при удалении навыка:', err);
        setError('Не удалось удалить навык');
      }
    }
  };

  if (isLoading) {
    return <div className="loading">Загрузка навыков...</div>;
  }

  return (
    <div className="skills-tab">
      <div className="skills-form">
        <h3>{editId ? 'Редактирование навыка' : 'Добавление нового навыка'}</h3>
        
        {skillGroups.length === 0 ? (
          <div className="alert alert-warning">
            Сначала создайте группу навыков на вкладке "Группы навыков"
          </div>
        ) : (
          <Formik
            initialValues={initialValues}
            validationSchema={SkillSchema}
            onSubmit={handleSubmit}
            enableReinitialize={true}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="form-group">
                  <label htmlFor="name">Название навыка *</label>
                  <Field type="text" id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="error-message" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="group_id">Группа навыков *</label>
                  <Field as="select" id="group_id" name="group_id" className="form-control">
                    <option value="">Выберите группу навыков</option>
                    {skillGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="group_id" component="div" className="error-message" />
                </div>
                
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
                        setInitialValues({ name: '', group_id: '' });
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

      <div className="skills-list">
        <h3>Список навыков</h3>
        {skills.length === 0 ? (
          <p>Навыки не найдены. Создайте новый навык.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Группа</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {skills.map(skill => (
                <tr key={skill.id}>
                  <td>{skill.id}</td>
                  <td>{skill.name}</td>
                  <td>{skill.group_name}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(skill)}
                    >
                      Редактировать
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(skill.id)}
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

export default SkillsTab;
