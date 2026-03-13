# 04 — Tech Stack

> Заполняется агентом после определения стека. Нельзя использовать незафиксированные «общепринятые» практики.

---

## Выбранный стек

| Категория       | Технология           | Версия           | Причина выбора                                                                                 |
| --------------- | -------------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| Язык            | TypeScript           | 5.x              | Типизированный API библиотеки и конфигов, меньше ошибок в runtime                              |
| Runtime         | JavaScript (browser) | ES2022+          | Целевая среда потребления библиотеки                                                           |
| Renderer API    | Canvas 2D API        | browser standard | Прямое соответствие целевому use case                                                          |
| Build / Dev     | Vite                 | 7.x              | Подходит и для npm-библиотеки, и для playground                                                |
| Playground UI   | Vue 3                | 3.5.x            | Реактивное UI-состояние, чище отделение view-логики от runtime и проще сопровождать playground |
| Tests           | Vitest               | 3.x              | Нативная интеграция с Vite и быстрые unit-тесты                                                |
| Package manager | npm                  | 10.x+            | Целевой формат публикации и потребления пакета                                                 |

---

## Рассмотренные альтернативы

| Технология                               | Почему не выбрана                                                                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| JSON atlas                               | В MVP избыточен; пользователь подтвердил формат regular grid sprite sheet                       |
| Phaser / PixiJS как основа               | Слишком широкая зависимость для собственного минимального core                                  |
| React / Vue adapters для library runtime | Нет подтвержденной необходимости в первой версии; Vue используется только внутри dev playground |
| WebGL renderer                           | Отложен в дальний backlog                                                                       |

---

## Риски стека

| Риск                                                                                    | Вероятность | Влияние | Митигация                                                                            |
| --------------------------------------------------------------------------------------- | ----------- | ------- | ------------------------------------------------------------------------------------ |
| Vite может оказаться недостаточно гибким для будущей публикации нескольких entry points | Medium      | Medium  | Держать архитектуру пакета модульной и пересмотреть bundler после стабилизации API   |
| Canvas 2D может стать узким местом для сложных сцен                                     | Medium      | Medium  | Не смешивать core анимации и будущий renderer, оставить путь к WebGL                 |
| Сложный API тайминга                                                                    | Medium      | High    | Формализовать deterministic timing policy и покрыть тестами                          |
| Playground UI может слишком плотно связаться с Vue-компонентами                         | Medium      | Medium  | Держать runtime в composable/utility-слое, не вносить Vue-зависимости в library core |

---

## Best Practices

> Зафиксированные best practices по выбранным технологиям. Агент обязан опираться на них в реализации.

### TypeScript

- Официальная документация: https://www.typescriptlang.org/docs/
- Best practices:
  - экспортировать стабильные публичные типы для runtime-конфигов
  - отделять internal types от public API
  - включить строгую типизацию для core-модулей

### Canvas 2D API

- Официальная документация: https://developer.mozilla.org/docs/Web/API/Canvas_API
- Best practices:
  - отделять вычисление состояния анимации от фактического вызова `drawImage`
  - использовать `deltaTime` или вычисление по elapsed time вместо зависимости от фиксированного цикла
  - не смешивать asset loading, animation state и rendering в одном объекте

### Vite

- Официальная документация: https://vite.dev/guide/
- Best practices:
  - разделять library mode и playground app
  - минимизировать runtime-specific magic в сборке библиотеки
  - держать конфигурацию сборки прозрачной для публикации в npm

### Vue 3

- Официальная документация: https://vuejs.org/guide/introduction.html
- Best practices:
  - для новых playground-компонентов использовать Composition API через `script setup`
  - выносить canvas/runtime orchestration в composable, а не в шаблон компонента
  - изолировать Vue-слой от public API библиотеки
  - для typecheck playground использовать `vue-tsc`

Машино-проверяемые правила frontend-слоя задаются через `eslint.config.js`, `.prettierrc.json`, `stylelint.config.js` и `tsconfig.json`.
Human-level frontend guides вынесены в `docs/frontend-styleguide.md` и связанные документы.

### Vitest

- Официальная документация: https://vitest.dev/guide/
- Best practices:
  - покрыть unit-тестами вычисление кадров и timing policy
  - отдельно тестировать frame skipping при одновременном использовании `fps` и `duration`

---

## Проектные соглашения

<!-- Специфические соглашения для этого проекта, не покрытые стандартными best practices -->

- В MVP используется regular grid sprite sheet вместо atlas.
- При наличии и `fps`, и `duration` приоритет у `duration`.
- Playground является частью dev workflow, но не частью production runtime библиотеки.
- Vue 3 допускается внутри playground, но не меняет framework-agnostic статус public runtime API.
- Корневой пакет экспортирует стабильный public API, а subpath exports разделены на `./core`, `./renderers` и `./types`.
