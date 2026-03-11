# 08 — Vector DB

> Заполняется агентом после получения согласия пользователя на использование Vector DB.
> Если Vector DB не используется — заполняется раздел "Решение не использовать".

---

## Статус

- [ ] Vector DB не нужна (заполните раздел ниже)
- [ ] Vector DB используется (заполните полный раздел ниже)

---

## Решение не использовать Vector DB

**Причина:**
_TBD — агент заполняет обоснование_

---

## Решение использовать Vector DB

### Use Cases

<!-- Зачем нужна Vector DB в этом проекте? -->
- _TBD_

### Какие данные индексируются

| Тип данных          | Источник          | Формат         |
|---------------------|-------------------|----------------|
| _TBD_               | _TBD_             | _TBD_          |

### Canonical Source of Truth

Данные берутся из: _TBD_

### Embedding Provider / Model

| Параметр           | Значение                    |
|--------------------|-----------------------------|
| Провайдер          | _TBD (OpenAI / Cohere / Ollama / ...)_ |
| Модель             | _TBD_                       |
| Размерность        | _TBD_                       |

### Chunking Strategy

| Параметр           | Значение                    |
|--------------------|-----------------------------|
| Chunk size         | _TBD_                       |
| Overlap            | _TBD_                       |
| Стратегия          | _TBD (fixed / semantic / ...)_ |

### Indexing / Sync Policy

- Первичная индексация: _TBD_
- Обновление: _TBD_
- Удаление: _TBD_

### Retrieval Policy

- Top-K: _TBD_
- Score threshold: _TBD_
- Фильтрация: _TBD_

### Риски

| Риск                          | Влияние | Митигация         |
|-------------------------------|---------|-------------------|
| Drift между векторами и данными | Medium | _TBD_            |
| Стоимость эмбеддингов         | Medium  | _TBD_             |

### Стоимость

- Провайдер: _TBD_
- Примерная стоимость: _TBD_

### Required Configuration

Заполните в `.env`:

```bash
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=          # опционально
OPENAI_API_KEY=          # если используется OpenAI
EMBEDDING_MODEL=         # название модели
EMBEDDING_PROVIDER=      # openai / cohere / ollama
VECTOR_COLLECTION_NAME=  # название коллекции
```

Запуск:
```bash
docker compose -f docker-compose.vector-db.yml up -d
```
