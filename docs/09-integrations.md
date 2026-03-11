# 09 — Integrations

Список интеграций, переменных окружения и токенов.

---

## GitHub Project

| Параметр          | Значение                                              |
|-------------------|-------------------------------------------------------|
| URL               | https://github.com/users/Vitykovskiy/projects/4       |
| Тип               | Board (Kanban)                                        |
| Статусы           | Backlog / In Progress / Done                          |

---

## Переменные окружения

Полный список переменных — в `.env.example`.

| Переменная              | Обязательная | Описание                              |
|-------------------------|--------------|---------------------------------------|
| `GITHUB_TOKEN`          | Да           | GitHub Personal Access Token          |
| `GITHUB_REPO`           | Да           | owner/repo-name                       |
| `GITHUB_PROJECT_URL`    | Да           | URL GitHub Project                    |
| `QDRANT_HOST`           | Нет          | Хост Qdrant (только при использовании Vector DB) |
| `QDRANT_PORT`           | Нет          | Порт Qdrant                           |
| `QDRANT_API_KEY`        | Нет          | API ключ Qdrant                       |
| `OPENAI_API_KEY`        | Нет          | OpenAI API ключ (если выбран OpenAI)  |
| `EMBEDDING_MODEL`       | Нет          | Название embedding модели             |
| `EMBEDDING_PROVIDER`    | Нет          | Провайдер эмбеддингов                 |
| `VECTOR_COLLECTION_NAME`| Нет          | Название коллекции в Qdrant           |

---

## Токены и секреты

| Токен              | Где хранится  | Права                                   |
|--------------------|---------------|-----------------------------------------|
| GitHub PAT         | `.env`        | `repo`, `read:org`, `project`           |
| OpenAI API Key     | `.env`        | Billing access                          |
| Qdrant API Key     | `.env`        | Read/Write                              |

---

## Статус интеграций

| Интеграция         | Статус        | Примечания                              |
|--------------------|---------------|-----------------------------------------|
| GitHub Issues      | Подключено    | Репозиторий доступен через `gh` CLI     |
| GitHub Project     | Подключено    | Project `#4`, статусы: Backlog / In Progress / Done |
| Vector DB (Qdrant) | Не подключена | Подключается по согласию пользователя   |

---

## Примечания по настройке

1. Создайте GitHub Personal Access Token с правами: `repo`, `read:org`, `project`.
2. Вписайте его в `.env` как `GITHUB_TOKEN`.
3. Вписайте URL GitHub Project в поле выше и в `.env` как `GITHUB_PROJECT_URL`.
4. Запустите `bash scripts/check-environment.sh` для проверки.
