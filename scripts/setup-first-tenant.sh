#!/usr/bin/env bash
# Configura o primeiro município no SIGCEM após o deploy inicial.
# Uso: ./scripts/setup-first-tenant.sh
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001/api/v1}"
ADMIN_TOKEN="${ADMIN_TOKEN:?Defina ADMIN_TOKEN com o JWT de um usuário ADMIN}"

MUNICIPIO_NOME="${MUNICIPIO_NOME:?Defina MUNICIPIO_NOME (ex: Prefeitura de Exemplo)}"
MUNICIPIO_DOMINIO="${MUNICIPIO_DOMINIO:?Defina MUNICIPIO_DOMINIO (ex: exemplo.sc.gov.br)}"
MUNICIPIO_ESTADO="${MUNICIPIO_ESTADO:-SC}"
MUNICIPIO_CIDADE="${MUNICIPIO_CIDADE:-$MUNICIPIO_NOME}"

echo "=== SIGCEM — Setup do Primeiro Tenant ==="
echo "API: $API_URL"
echo "Município: $MUNICIPIO_NOME ($MUNICIPIO_DOMINIO)"
echo ""

# 1. Criar tenant/cemetery inicial
echo "[1/3] Criando cemitério padrão..."
CEMETERY_RESPONSE=$(curl -sf -X POST "$API_URL/cemeteries" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"nome\": \"Cemitério Municipal de $MUNICIPIO_CIDADE\",
    \"endereco\": \"A preencher\",
    \"cidade\": \"$MUNICIPIO_CIDADE\",
    \"estado\": \"$MUNICIPIO_ESTADO\",
    \"capacidadeTotal\": 1000
  }")

CEMETERY_ID=$(echo "$CEMETERY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Cemitério criado: $CEMETERY_ID"

# 2. Criar quadra padrão
echo "[2/3] Criando quadra A..."
QUADRA_RESPONSE=$(curl -sf -X POST "$API_URL/quadras" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"cemiterioId\": \"$CEMETERY_ID\",
    \"codigo\": \"A\",
    \"descricao\": \"Quadra A\",
    \"capacidade\": 100
  }")

QUADRA_ID=$(echo "$QUADRA_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Quadra criada: $QUADRA_ID"

# 3. Health check
echo "[3/3] Verificando saúde da API..."
HEALTH=$(curl -sf "$API_URL/health" | grep -o '"status":"[^"]*"' | head -1)
echo "   $HEALTH"

echo ""
echo "=== Setup concluído! ==="
echo "Cemitério ID : $CEMETERY_ID"
echo "Quadra ID    : $QUADRA_ID"
echo ""
echo "Próximos passos:"
echo "  1. Acesse o painel em $API_URL/../ e faça login"
echo "  2. Cadastre jazigos na quadra criada"
echo "  3. Configure o realm do Keycloak para o município"
