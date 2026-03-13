# 05 — Architecture

> Заполняется агентом после определения стека и снятия задачи.

---

## Контекст системы

<!-- Что это за система, с чем взаимодействует, кто использует -->
Система состоит из framework-agnostic core библиотеки для sprite-анимации и отдельного playground-приложения на Vue 3. Core используется разработчиком внутри веб-приложения на `canvas`, а playground помогает разработчику и дизайнеру настраивать сетку кадров, тайминг и позиционирование без изменения public API библиотеки.

---

## Компоненты

| Компонент       | Зона ответственности         | Технология   |
|-----------------|------------------------------|--------------|
| Asset Loader    | Загрузка sprite sheet и отдельных кадров | Browser image loading / TypeScript |
| Sprite Model    | Описание сетки кадров, frame sequence и конфигурации анимации | TypeScript |
| Animation Player| Вычисление текущего кадра, тайминга, loop и frame skipping | TypeScript |
| Canvas Renderer | Отрисовка текущего кадра на `canvas`, масштаб и позиция | Canvas 2D API |
| Playground      | Настройка параметров, предпросмотр и сохранение конфига | Vue 3 + Vite + TypeScript |

---

## Public Entry Points

| Entry point                    | Назначение |
|--------------------------------|------------|
| `@vitykovskiy/canvas-sprite-animations`            | Стабильный корневой API для большинства потребителей |
| `@vitykovskiy/canvas-sprite-animations/core`       | Core-модели и фабрики runtime без renderer-specific логики |
| `@vitykovskiy/canvas-sprite-animations/renderers`  | Renderer-фабрики, начиная с `canvas` |
| `@vitykovskiy/canvas-sprite-animations/types`      | Публичные типы конфигурации и runtime-контрактов |

---

## Потоки данных

```
[Sprite Sheet Image / Frame Images] --> [Asset Loader] --> [Sprite Model]
[Sprite Model] --> [Animation Player] --> [Canvas Renderer]
[Sprite Model] --> [Vue Playground UI]
[Animation Player] --> [Playground Preview]
```

Разработчик или playground передает в core либо sprite sheet с конфигом сетки, либо набор отдельных кадров. `Animation Player` вычисляет текущий кадр на основе времени, `fps`, `duration` и режима loop. Vue-слой playground хранит UI-состояние и делегирует canvas/runtime orchestration в composable. `Canvas Renderer` получает вычисленный кадр и рисует его в заданной позиции и масштабе независимо от формата ассета.

---

## Интеграции

| Внешняя система  | Тип интеграции   | Направление   | Описание      |
|------------------|------------------|---------------|---------------|
| npm registry     | Package distribution | Outbound   | Публикация библиотеки как npm-пакета |
| GitHub           | Project management | Bidirectional | Ведение issues, project board и документации |

---

## Технические риски

| Риск                        | Вероятность | Влияние | Митигация             |
|-----------------------------|-------------|---------|------------------------|
| Слишком плотная связка playground и runtime | Medium | Medium | Отделить playground как отдельный consumer core API |
| Vue-состояние может начать дублировать runtime-логику | Medium | Medium | Держать бизнес-логику и canvas-цикл в composable, а шаблон компонента оставлять декларативным |
| Непрозрачный timing engine  | Medium      | High    | Сделать timing policy явной и покрыть тестами |
| Будущая миграция к WebGL усложнится | Low | Medium | Не связывать core вычислений с Canvas 2D renderer |

---

## Package Structure

```text
src/
  core/
    animation-player.ts
    frame-sequence.ts
    sprite-sheet.ts
    index.ts
  playground/
    App.vue
    main.ts
    usePlaygroundRuntime.ts
    styles.css
  renderers/
    create-canvas-sprite-renderer.ts
    index.ts
  types.ts
  index.ts
```
