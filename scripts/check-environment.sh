#!/usr/bin/env bash
# check-environment.sh — Проверка готовности среды для работы агента
# Запуск: bash scripts/check-environment.sh

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

ERRORS=0

echo ""
echo "======================================"
echo "  Environment Check"
echo "======================================"
echo ""

# 1. git config
if git config user.name &>/dev/null && git config user.email &>/dev/null; then
  ok "git config: user.name=$(git config user.name), user.email=$(git config user.email)"
else
  fail "git config не настроен. Выполните: git config --global user.name 'Name' && git config --global user.email 'email'"
fi

# 2. git remote
if git remote get-url origin &>/dev/null; then
  ok "git remote origin: $(git remote get-url origin)"
else
  fail "git remote origin не настроен. Выполните: git remote add origin <url>"
fi

# 3. gh auth
if gh auth status &>/dev/null; then
  ok "gh auth: аутентификация активна"
  gh auth status 2>&1 | grep -E "Logged in|Token scopes" | while read -r line; do
    echo "         $line"
  done
else
  fail "gh auth: не аутентифицирован. Выполните: gh auth login"
fi

# 4. Check GITHUB_TOKEN in .env
if [ -f ".env" ]; then
  if grep -q "^GITHUB_TOKEN=" .env && ! grep -q "^GITHUB_TOKEN=your_github" .env; then
    ok ".env: GITHUB_TOKEN задан"
  else
    warn ".env: GITHUB_TOKEN не заполнен или содержит placeholder"
  fi

  if grep -q "^GITHUB_REPO=" .env && ! grep -q "^GITHUB_REPO=owner/repo" .env; then
    ok ".env: GITHUB_REPO задан"
  else
    warn ".env: GITHUB_REPO не заполнен"
  fi
else
  warn ".env не найден. Создайте его из .env.example"
fi

# 5. Check gh repo access
REPO=$(git remote get-url origin 2>/dev/null | sed 's/.*github.com[:/]//' | sed 's/\.git$//' || echo "")
if [ -n "$REPO" ]; then
  if gh repo view "$REPO" &>/dev/null; then
    ok "Доступ к репозиторию ${REPO}: есть"
  else
    fail "Нет доступа к репозиторию ${REPO}. Проверьте права токена."
  fi
fi

# 6. Check GITHUB_PROJECT_URL in docs
if grep -q "ВПИСАТЬ СЮДА URL" docs/09-integrations.md 2>/dev/null; then
  warn "docs/09-integrations.md: URL GitHub Project не вписан"
else
  ok "docs/09-integrations.md: URL GitHub Project задан"
fi

echo ""
echo "======================================"

if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}Окружение полностью готово к работе агента.${NC}"
else
  echo -e "${RED}Найдено проблем: ${ERRORS}${NC}"
  echo "Исправьте проблемы выше, затем передайте агенту бизнес-задачу."
fi

echo ""
