# TypeScript Guidelines

## Type Rules

- Не использовать `any`.
- Для public shape данных использовать явные интерфейсы или type aliases.
- Для optional form values учитывать оба случая: `string` и `number`, если значение приходит из `v-model`.
- Ошибки runtime оформлять через `Error` с понятным сообщением.
- Не прятать небезопасные приведения типов без причины.

## Imports

- Предпочитать `import type` для type-only imports.
- Не смешивать type imports и value imports без необходимости.

## Runtime Separation

- Типы component-layer держать рядом с компонентным разделом.
- Runtime/config types держать отдельно от component-facing types.
- Vue-specific типы не протаскивать в library public API.
