# Frontend Architecture

## Scope

- `src/playground/**/*.vue`
- `src/playground/**/*.ts`
- frontend-конфигурация сборки

## Principles

- Playground остается consumer-слоем над библиотекой.
- Public runtime API библиотеки не зависит от Vue.
- UI должен быть предсказуемым и простым для локальной правки.

## Structure

```text
src/playground/
  App.vue
  components/
    PlaygroundPreview.vue
    PlaygroundSidebar.vue
    types.ts
  main.ts
  types/
    runtime.ts
  usePlaygroundRuntime.ts
  styles.css
```

## Layer Rules

- `App.vue` поднимает shared runtime/context и не содержит business logic.
- `components/` содержит только UI-блоки.
- `components/types.ts` содержит типы, относящиеся к component-layer.
- `types/` содержит runtime/configuration types, не привязанные к одному компоненту.
- `usePlaygroundRuntime.ts` содержит orchestration, side effects и shared state.

## Review Checklist

- Нет prop drilling через `App.vue`, если состояние может браться из shared composable/context.
- Нет дублирования library runtime logic в UI-компонентах.
- Side effects и cleanup сосредоточены в composable или локальном lifecycle компонента.
