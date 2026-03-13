# 03 — Scope and Boundaries

> Заполняется агентом после качественного снятия задачи.

---

## Что входит в проект

- npm-библиотека для sprite-анимации в вебе на `canvas`
- Загрузка sprite sheet как изображения
- Загрузка frame sequence как набора отдельных кадров
- Регулярная сетка кадров через `frameWidth`, `frameHeight`, `columns`, `rows`
- Runtime API для воспроизведения, паузы, остановки, цикла, масштаба и позиции
- Тайминг через `fps` и/или `duration`
- Dev playground на Vue 3 для настройки и проверки параметров
- Сохранение конфигурации анимации в JSON

---

## Что НЕ входит в проект

- Визуальный editor анимаций
- Timeline с ручной раскладкой кадров
- State machine для `idle/run/jump`
- Framework adapters для public runtime (`React`, `Vue` и др.)
- WebGL renderer в первой версии
- Physics, collisions, audio sync

---

## Ограничения первой версии (v1)

- Только веб-платформа
- Только `canvas 2d`
- Основные форматы ассетов — regular grid sprite sheet и frame sequence
- Playground ориентирован на разработку и тестирование, а не на конечных пользователей

---

## Deferred Scope (следующие версии)

| Функциональность       | Версия  | Обоснование отсрочки  |
|------------------------|---------|-----------------------|
| State switching / animation states | v2 | В MVP нет подтвержденного use case |
| Framework adapters | v2 | Сначала нужен стабильный framework-agnostic core |
| WebGL renderer | Backlog | Слишком далеко от целей первой версии |
| Визуальный editor | Backlog | Дорого в реализации и не нужен для запуска MVP |
