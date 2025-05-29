# Этап сборки
FROM node:18-alpine AS builder

# Установка рабочей директории
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package.json package-lock.json* ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

# Этап запуска
FROM node:18-alpine AS runner

WORKDIR /app

# Установка переменных окружения для production
ENV NODE_ENV=production

# Создание пользователя с ограниченными правами
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копирование необходимых файлов из этапа сборки
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Установка прав для нового пользователя
RUN chown -R nextjs:nodejs /app

# Переключение на пользователя с ограниченными правами
USER nextjs

# Открытие порта
EXPOSE 3000

# Установка переменной окружения для хоста
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Запуск приложения
CMD ["node", "server.js"]