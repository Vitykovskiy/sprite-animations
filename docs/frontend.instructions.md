# Frontend Instructions

Короткие операционные правила для агента.

## Before Editing

- Сначала смотри `eslint.config.js`, `.prettierrc.json`, `stylelint.config.js`, `tsconfig.json`.
- Затем сверяйся с `docs/frontend-architecture.md`, `docs/vue-guidelines.md`, `docs/typescript-guidelines.md`, `docs/styling-guidelines.md`.

## While Editing

- Не дублируй правила из конфигов в коде или комментариях.
- Не меняй public runtime API ради удобства Vue-слоя.
- Если меняется структура frontend-слоев, обнови docs.

## Done

- Прогони `npm run lint`
- Прогони `npm run format:check`
- Прогони `npm run typecheck`
- Если менялся playground, прогони `npm run playground:build`
