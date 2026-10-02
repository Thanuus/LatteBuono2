# Latte Buono - Landing Page

Site institucional + catálogo de produtos + sistema de pedidos (enviados para Google Sheets) para a Latte Buono, produtora de derivados de leite de búfala.

## Sobre o Projeto

Landing page profissional e responsiva desenvolvida com HTML5, CSS3 e JavaScript puro, sem dependências de backend. O site permite que os clientes conheçam a empresa, visualizem os produtos, montem um carrinho e enviem o pedido, que é registrado automaticamente em uma Planilha do Google via Google Apps Script.

## Estrutura do Projeto

```
Latte buono/
├── index.html          # Página principal
├── admin.html          # Gerenciador de produtos (adicionar/editar/remover)
├── css/
│   ├── style.css       # Estilos do site
│   └── admin.css       # Estilos do gerenciador
├── js/
│   ├── script.js       # Lógica do carrinho e envio de pedidos
│   └── admin.js        # Lógica do gerenciador de produtos
├── google-apps-script/
│   └── Code.gs         # Script que grava os pedidos na Planilha do Google
├── images/             # Imagens do site
│   └── README.md       # Instruções para adicionar imagens
└── README.md           # Este arquivo
```

## Funcionalidades

- ✅ Design responsivo (mobile-first)
- ✅ Catálogo de produtos com preços fixos
- ✅ Carrinho de compras funcional
- ✅ Cálculo de subtotal
- ✅ Formulário de dados para entrega
- ✅ Envio de pedidos para Planilha do Google (Google Sheets via Apps Script)
- ✅ Design artesanal e premium
- ✅ SEO básico
- ✅ Acessibilidade

## Como Personalizar

### 1. URL do Google Apps Script

Os pedidos são enviados para uma Planilha do Google. Abra o arquivo `js/script.js` e altere a URL, se necessário:

```javascript
const CONFIG = {
    appsScriptUrl: "https://script.google.com/macros/s/.../exec", // URL do Web App
    companyName: "Latte Buono",
    currency: "BRL"
};
```

A URL é pública (não contém credenciais). Para recriar o Web App, veja `google-apps-script/Code.gs`.

**Nota sobre `no-cors`:** o envio usa `mode: 'no-cors'` porque o Apps Script não aceita preflight CORS. Consequência: o site não consegue ler a resposta — o pedido é enviado e o cliente vê a confirmação, mas sem leitura do retorno do servidor.

### 2. Produtos

**Sem precisar editar o código:** abra a página `admin.html` (link "Gerenciar produtos" no rodapé do site). Nela você pode adicionar, editar e remover produtos, além de **ocultar** produtos do catálogo sem apagá-los (botão 👁️/🙈 ou campo "Visível no site" no formulário) e restaurar a lista padrão. As alterações ficam salvas no navegador (localStorage) e aparecem automaticamente na página inicial (atualize-a se já estiver aberta).

**Editando o código diretamente** (lista usada apenas quando não há nada salvo no navegador), edite o array `defaultProducts` no arquivo `js/script.js`:

```javascript
const products = [
    {
        id: 1,
        name: "Nome do Produto",
        description: "Descrição do produto",
        priceType: "fixed",        // "fixed" ou "range"
        price: 20,                // Para preço fixo
        priceMin: 30,             // Para faixa de preço
        priceMax: 40,             // Para faixa de preço
        image: "images/produto.jpg",
        badge: "Opcional"         // Badge opcional (ex: "Mais Vendido")
    }
];
```

### 3. Imagens

Substitua as imagens na pasta `images/` seguindo as instruções do arquivo `images/README.md`.

### 4. Textos e Conteúdo

Edite o arquivo `index.html` para alterar textos, descrições e informações da empresa.

## Como Hospedar no Cloudflare Pages

1. Acesse [Cloudflare Pages](https://pages.cloudflare.com/)
2. Crie um novo projeto
3. Conecte seu repositório Git ou faça upload dos arquivos manualmente
4. Configure:
   - **Build command:** (deixe vazio)
   - **Build output directory:** `/` (raiz do projeto)
5. Clique em "Deploy"

O site estará disponível em uma URL como `https://seu-projeto.pages.dev`

## Como Hospedar em Outras Plataformas

### Netlify
1. Arraste a pasta do projeto para [Netlify Drop](https://app.netlify.com/drop)
2. Pronto!

### Vercel
1. Importe o projeto no [Vercel](https://vercel.com/)
2. Configure como site estático
3. Deploy

### GitHub Pages
1. Suba os arquivos para um repositório GitHub
2. Vá em Settings > Pages
3. Selecione a branch principal
4. Deploy

## Suporte

Para dúvidas ou problemas, verifique:
1. Se todas as imagens estão na pasta correta
2. Se o número do WhatsApp está no formato correto
3. Se os produtos estão configurados corretamente

## Licença

Projeto desenvolvido para Latte Buono.
