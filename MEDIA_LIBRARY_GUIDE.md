# Biblioteca de Mídia - Guia de Uso

## Funcionalidades Implementadas

A biblioteca de mídia do BlazeBurger oferece um sistema completo para gerenciar imagens e vídeos:

### ✅ Upload de Arquivos
- Upload múltiplo de imagens e vídeos
- Suporte para formatos: JPG, PNG, WebP, MP4, WebM e mais
- Validação de tipos MIME
- Feedback em tempo real com toast notifications

### ✅ Organização por Categorias
- **Categorias pré-configuradas:**
  - 🏠 Home - Imagens para a página inicial
  - 🍔 Produtos - Fotos de produtos e cardápio
  - 🎯 Promoções - Banners e imagens de promoções
  - 👥 Sobre - Fotos da empresa e equipe
  - ⭐ Depoimentos - Fotos de clientes e depoimentos
  - 📁 Outros - Outras imagens

- Filtrar por categoria na biblioteca
- Atribuir categoria ao fazer upload

### ✅ Seleção de Imagens para a Home
- Componente `MediaSelector` para seleção com pré-visualização
- Integrado com admin da Home (`personalizacao.home.tsx`)
- Suporta seleção de:
  - Imagem hero
  - Imagem hero secundária

### ✅ Pré-visualização
- Preview em miniatura na galeria
- Fullscreen preview para visualizar imagem grande
- Informações de arquivo (nome, tipo, URL)
- Cópia fácil de URL para clipboard

### ✅ Busca e Filtros
- Busca por nome de arquivo
- Filtro por tipo (Imagens, Vídeos, Todos)
- Filtro por categoria

## Arquitetura

### Banco de Dados (Supabase)
- Tabela `media_assets` - Armazena metadados dos arquivos
- Tabela `media_categories` - Define categorias disponíveis
- Storage `media` - Armazena os arquivos reais

### Componentes React
- **MediaLibrary** - Interface completa de gerenciamento
- **MediaPicker** - Modal para seleção com categorias
- **MediaSelector** - Wrapper com pré-visualização avançada

### Hooks
- `useMediaCategories()` - Busca categorias
- `useMediaAssets()` - Lista ativos com filtros
- `useUpdateMediaAsset()` - Atualiza metadados
- `useDeleteMediaAsset()` - Deleta ativos

## Rotas Disponíveis

### Admin
- **`/admin/midia`** - Biblioteca de mídia completa

### Componentes Reutilizáveis
- `MediaPicker` - Para seleção em formulários
- `MediaSelector` - Para seleção com preview

## Como Usar

### No Admin (Gerenciar Mídia)
1. Acesse `/admin/midia`
2. Use o botão "Upload" para enviar novos arquivos
3. Selecione uma categoria para filtrar
4. Use o painel de detalhes para visualizar metadados
5. Clique em delete para remover arquivos

### Selecionando Imagem para a Home
```tsx
import { MediaSelector } from "@/components/MediaSelector";

function MyComponent() {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <>
      <button onClick={() => setMediaOpen(true)}>
        Selecionar imagem
      </button>

      <MediaSelector
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(asset) => setSelectedImage(asset.url)}
        title="Selecionar imagem hero"
        description="Escolha uma imagem para a seção hero da Home"
      />

      {selectedImage && <img src={selectedImage} alt="Preview" />}
    </>
  );
}
```

### Usando MediaPicker em um Formulário
```tsx
import { MediaPicker } from "@/components/MediaPicker";

function ProductForm() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);

  return (
    <>
      <button onClick={() => setPickerOpen(true)}>
        Escolher imagem do produto
      </button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(asset) => setProductImage(asset.url)}
      />

      {productImage && <img src={productImage} alt="Produto" />}
    </>
  );
}
```

## Banco de Dados

### Tabela `media_categories`
```sql
- id: UUID (pk)
- name: TEXT (Nome da categoria - UNIQUE)
- slug: TEXT (Identificador URL - UNIQUE)
- description: TEXT (Descrição opcional)
- icon: TEXT (Emoji ou ícone)
- order_index: INT (Ordem de exibição)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Tabela `media_assets` (nova coluna)
```sql
- category_id: UUID FK (Referência para media_categories)
```

## Migrações

A migração `20260616000001_add_media_categories.sql` criou:
- Tabela `media_categories` com categorias pré-configuradas
- Coluna `category_id` na tabela `media_assets`
- Índices e políticas de segurança (RLS)

## Segurança

- RLS (Row Level Security) ativado
- Acesso restrito a staff (admin e equipe)
- Validação de tipos MIME
- Cópia de URL via signed URLs com expiração

## Próximos Passos Sugeridos

1. ✅ Integrar com admin da Home para seleção de imagens
2. Permitir bulk delete de imagens
3. Adicionar cropping e redimensionamento de imagens
4. Implementar compressão automática
5. Adicionar watermark para imagens de produto
6. Sistema de tags/keywords para melhor busca
7. Análise de uso (quais imagens são mais usadas)
