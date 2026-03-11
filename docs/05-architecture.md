# 05 — Architecture

> Заполняется агентом после определения стека и снятия задачи.

---

## Контекст системы

<!-- Что это за система, с чем взаимодействует, кто использует -->
Система состоит из framework-agnostic core библиотеки для sprite-анимации и отдельного playground-приложения. Core используется разработчиком внутри веб-приложения на `canvas`, а playground помогает разработчику и дизайнеру настраивать сетку кадров, тайминг и позиционирование.

---

## Компоненты

| Компонент       | Зона ответственности         | Технология   |
|-----------------|------------------------------|--------------|
| Asset Loader    | Загрузка изображения sprite sheet | Browser image loading / TypeScript |
| Sprite Model    | Описание сетки кадров и конфигурации анимации | TypeScript |
| Animation Player| Вычисление текущего кадра, тайминга, loop и frame skipping | TypeScript |
| Canvas Renderer | Отрисовка текущего кадра на `canvas`, масштаб и позиция | Canvas 2D API |
| Playground      | Настройка параметров, предпросмотр и сохранение конфига | Vite + TypeScript |

---

## Public Entry Points

| Entry point                    | Назначение |
|--------------------------------|------------|
| `sprite-animations`            | Стабильный корневой API для большинства потребителей |
| `sprite-animations/core`       | Core-модели и фабрики runtime без renderer-specific логики |
| `sprite-animations/renderers`  | Renderer-фабрики, начиная с `canvas` |
| `sprite-animations/types`      | Публичные типы конфигурации и runtime-контрактов |

---

## Потоки данных

```
[Sprite Sheet Image] --> [Asset Loader] --> [Sprite Model]
[Sprite Model] --> [Animation Player] --> [Canvas Renderer]
[Sprite Model] --> [Playground UI]
[Animation Player] --> [Playground Preview]
```

Разработчик или playground передает в core изображение и конфиг сетки кадров. `Animation Player` вычисляет текущий кадр на основе времени, `fps`, `duration` и режима loop. `Canvas Renderer` получает вычисленный кадр и рисует его в заданной позиции и масштабе.

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
| Непрозрачный timing engine  | Medium      | High    | Сделать timing policy явной и покрыть тестами |
| Будущая миграция к WebGL усложнится | Low | Medium | Не связывать core вычислений с Canvas 2D renderer |

---

## Package Structure

```text
src/
  core/
    animation-player.ts
    sprite-sheet.ts
    index.ts
  renderers/
    create-canvas-sprite-renderer.ts
    index.ts
  types.ts
  index.ts
```
