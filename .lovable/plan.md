# Plano de implementação — BlazeBurger (10 features)

Vou implementar as 10 features consumindo o schema já existente, sem migrations e sem mexer em RLS.

## Etapas

### 1. Cart store — suporte a `notes`
- `src/lib/cart-store.tsx`: estender `CartItem` com `notes?: string`, `add()` aceita `notes`, persistência localStorage já cobre.

### 2. Hook de horário + Banner
- `src/lib/business-hours.ts`: hook `useBusinessHours()` → `{ isOpen, nextOpenTime, closedMessage, config }`. Carrega `settings` chave `business_hours` via React Query.
- `src/components/BusinessHoursBanner.tsx`: banner vermelho fixo abaixo do header quando fechado.
- Montar banner em `__root.tsx`.

### 3. Cupom no checkout
- `src/routes/checkout.tsx`: seção "Cupom de desconto" com input + Aplicar + remoção.
  - Validação client-side (expires_at, used_count/max_uses, min_order).
  - Cálculo de desconto (percent/fixed), linha verde no resumo.
  - Ao confirmar: gravar `coupon_code` + `discount` em `orders`, depois `update used_count`.
  - Redirect após sucesso para `/pedido/{order_number}`.
  - Aplicar gating de horário: desabilita "Confirmar" quando fechado.
  - Lista de endereços salvos (cards) + opção "Outro endereço" + toast "Salvar este endereço?".

### 4. Página de rastreamento pública
- `src/routes/pedido.$orderNumber.tsx`: busca por `order_number`, timeline vertical 7 status, Realtime `UPDATE` (cleanup), botão WhatsApp da loja (busca `whatsapp_number` em settings).

### 5. Página do produto — quantidade + observações
- `src/routes/produto.$id.tsx`: seletor de quantidade (já existe) + textarea de notes (max 150 chars, contador). Passar `notes` ao `add()`.
- `src/components/CartDrawer.tsx`: exibir `notes` em itálico, text-xs muted.
- Gating de horário no botão "Adicionar".

### 6. Menu — busca aprimorada
- `src/routes/menu.tsx`: debounce 300ms, contador de resultados, dropdown ordenação (Relevância / Menor preço / Maior preço / Melhor avaliados), botão × no input, empty state com botão "Limpar busca", reset da busca ao trocar categoria.

### 7. Admin pedidos — notificações
- `src/routes/_authenticated/admin/pedidos.tsx`:
  - Web Audio beep ao receber INSERT com `status==='received'`.
  - Toast persistente com ação "Ver pedido".
  - `Notification.requestPermission()` no mount + `new Notification(...)`.
  - Badge contagem (lastSeenAt em localStorage, reset ao abrir).
  - Botão "📱 WhatsApp do cliente" em cada pedido expandido.

### 8. Dashboard admin
- `src/routes/_authenticated/admin/index.tsx` (overwrite): 5 cards com recharts.
  - 4 cards de métricas (ticket médio dia, pedidos mês, taxa cancelamento semana, total clientes).
  - BarChart 7 dias faturamento.
  - DonutChart status hoje.
  - Top 5 produtos (lista com barras).
  - Tabela últimos 5 pedidos.
  - `useQuery` separado por bloco, Skeleton.

### 9. Avaliações
- `src/routes/_authenticated/perfil.tsx`: botão "⭐ Avaliar" em pedidos entregues sem review, Dialog com 5 estrelas + comentário 300 chars; mostra "⭐ Avaliado" depois.
- Endereços salvos: seção CRUD com Dialog (Label, CEP, Rua, Número, Complemento, Bairro, Cidade), botões Editar/Excluir/Tornar padrão.
- `src/routes/_authenticated/admin/avaliacoes.tsx`: nova rota, lista, filtro por estrelas, header com média.
- Adicionar NavLink em `_authenticated/admin/route.tsx`.

### 10. Configurações admin
- `src/routes/_authenticated/admin/configuracoes.tsx`: campo "WhatsApp da loja" (máscara + preview) + seção "Horário de funcionamento" (toggle geral, 7 dias com toggle + from/to, mensagem). Salvar via UPSERT em `settings`.

## Detalhes técnicos
- WhatsApp link format: `https://wa.me/55{digits}?text=...` (strip não-dígitos).
- Realtime: sempre `removeChannel(ch)` no cleanup.
- Toda query: React Query + Skeleton em loading.
- Não criar migrations. Não alterar `client.ts`, `types.ts`.
- Manter classes existentes (gradient-flame, glow-brand, etc.).

Vou implementar tudo em sequência, agrupando edits paralelos por arquivo. Confirma para eu prosseguir?