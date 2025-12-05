# Package Architecture Audit: @kb-labs/plugin-template-cli

**Date**: 2025-11-16  
**Package Version**: 0.1.0

## 1. Package Purpose & Scope

Референсный CLI/REST/Studio plugin из шаблона плагина KB Labs.

---

## 9. CLI Commands Audit

### 9.1 Product-level help

- `pnpm kb template --help`:
  - продукт `template` отображается;
  - доступна команда:
    - `template:hello` — Print a hello message from the plugin template.

### 9.2 Статус команд (уровень help)

| Product     | Command IDs        | Status        | Notes                             |
|-------------|--------------------|---------------|-----------------------------------|
| `template`  | `template:hello`   | **OK (help)** | Видна в `kb template --help`      |

В этом проходе проверялась только доступность/отображение команд; поведение handler’ов не тестировалось.


