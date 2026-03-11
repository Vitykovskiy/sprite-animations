#!/usr/bin/env bash
# bootstrap.sh — Первичная проверка окружения для AI-dev-template
# Запуск: bash scripts/bootstrap.sh

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo ""
echo "======================================"
echo "  AI-dev-template Bootstrap Check"
echo "======================================"
echo ""

ERRORS=0

# 1. Check git
if command -v git &>/dev/null; then
  ok "git установлен ($(git --version))"
else
  fail "git не найден. Установите git: https://git-scm.com/"
  ERRORS=$((ERRORS + 1))
fi

# 2. Check gh CLI
if command -v gh &>/dev/null; then
  ok "gh CLI установлен ($(gh --version | head -1))"
else
  fail "gh CLI не найден. Установите: https://cli.github.com/"
  ERRORS=$((ERRORS + 1))
fi

# 3. Check .env exists
if [ -f ".env" ]; then
  ok ".env существует"
else
  warn ".env не найден. Скопируйте .env.example в .env и заполните переменные."
fi

# 4. Check docker (optional)
if command -v docker &>/dev/null; then
  ok "docker установлен (опционально, для Vector DB)"
else
  warn "docker не найден (нужен только при использовании Vector DB)"
fi

echo ""
echo "======================================"

if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}Окружение готово.${NC}"
  echo ""
  echo "Следующие шаги:"
  echo "  1. Скопируйте .env.example в .env и заполните GITHUB_TOKEN и GITHUB_REPO"
  echo "  2. Создайте GitHub Project вручную"
  echo "  3. Впишите URL GitHub Project в docs/09-integrations.md"
  echo "  4. Запустите: bash scripts/check-environment.sh"
  echo "  5. Передайте агенту ссылку на GitHub Project и бизнес-задачу"
else
  echo -e "${RED}Найдено ошибок: ${ERRORS}${NC}"
  echo "Исправьте ошибки выше перед продолжением."
fi

echo ""
