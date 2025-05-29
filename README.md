# RPG Frontend React

Веб-интерфейс для управления RPG сценариями и сессиями.

## Настройка

1. Создайте файл `.env` в директории `frontend`:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MINIO_URL=http://localhost:9000
```

2. Установите зависимости:

```bash
cd frontend
npm install
```

3. Запустите приложение:

```bash
npm start
```

## Порты

- Frontend React: http://localhost:3001
- Backend API: http://localhost:8000
- MinIO: http://localhost:9000 (API) и http://localhost:9001 (Console)

## Структура проекта

- `frontend/` - React приложение
  - `src/` - Исходный код
  - `public/` - Статические файлы
  - `.env` - Конфигурация окружения

## Примечания

- Убедитесь, что бекенд (RPGdata) запущен на порту 8000
- Для работы с файлами используется MinIO (S3-совместимое хранилище)
- Авторизация использует JWT токены 