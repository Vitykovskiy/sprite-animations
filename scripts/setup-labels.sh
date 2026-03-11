#!/usr/bin/env bash
# setup-labels.sh — Создание стандартных labels в GitHub репозитории
# Идемпотентный: повторный запуск безопасен (существующие labels не удаляются)
# Запуск: bash scripts/setup-labels.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
skip() { echo -e "${YELLOW}[SKIP]${NC} $1 (уже существует)"; }

# Определяем репозиторий
REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//' | sed 's/\.git$//' || echo "")

if [ -z "$REPO" ]; then
  echo "Ошибка: не удалось определить репозиторий из git remote."
  exit 1
fi

echo ""
echo "======================================"
echo "  Setup Labels для: ${REPO}"
echo "======================================"
echo ""

create_label() {
  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list --repo "$REPO" --limit 100 | grep -q "^${name}"; then
    skip "${name}"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$description" 2>/dev/null && ok "$name" || skip "$name"
  fi
}

# Type labels
create_label "type: epic"    "0075ca" "Крупный блок работы"
create_label "type: feature" "0052cc" "Новая функциональность"
create_label "type: bug"     "d73a4a" "Дефект"
create_label "type: task"    "e4e669" "Техническая задача"

# Area labels
create_label "area: frontend" "bfd4f2" "Фронтенд"
create_label "area: backend"  "d4c5f9" "Бэкенд"
create_label "area: infra"    "f9d0c4" "Инфраструктура"
create_label "area: docs"     "cfd3d7" "Документация"
create_label "area: data"     "e4f9c4" "Данные"

# Priority labels
create_label "priority: high"   "b60205" "Высокий приоритет"
create_label "priority: medium" "fbca04" "Средний приоритет"
create_label "priority: low"    "0e8a16" "Низкий приоритет"

# Status labels
create_label "status: blocked"     "ee0701" "Задача заблокирована"
create_label "status: needs-info"  "cc317c" "Нужна дополнительная информация"

echo ""
echo "Labels созданы. Репозиторий: https://github.com/${REPO}/labels"
echo ""
