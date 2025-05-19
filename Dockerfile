FROM node:16-alpine

WORKDIR /app

# Копируем только package.json сначала для использования кэша
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm install

# Устанавливаем отдельно нужные пакеты
RUN npm install react-router-dom formik yup axios --save

# Запускаем приложение
CMD ["npm", "start"]
