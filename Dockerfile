# Base image for development
FROM node:16-alpine AS development
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ENV NODE_ENV=development

# Копируем package.json
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm install
RUN npm install react-router-dom formik yup axios --save

# Создаем директорию для кэша ESLint с правильными правами
RUN mkdir -p /app/node_modules/.cache && chmod -R 777 /app/node_modules/.cache

EXPOSE 3000
CMD ["npm", "start"]

# Build image
FROM node:16-alpine AS build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Копируем package.json
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm install
RUN npm install react-router-dom formik yup axios --save

# Копируем исходный код
COPY frontend/ ./

# Собираем приложение
RUN npm run build

# Production image
FROM nginx:stable-alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
