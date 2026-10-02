/* ============================================
   LATTE BUONO - SCRIPT PRINCIPAL
   ============================================ */

/* ---------- CONFIGURAÇÕES ---------- */
const CONFIG = {
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbzExKz7bB-s1vC4I6PlqvwwL6BgvF11vkkXUc1sGMY1Is2Np3TCu3mLfbJ-xT_zW7sk9A/exec", // URL do Google Apps Script (Web App)
    companyName: "Latte Buono",
    currency: "BRL",
    pixKey: "24999405665",           // Chave Pix (telefone)
    pixRecipient: "Thanus Raposo",   // Nome do recebedor
    whatsappNumber: "5524999405665"  // WhatsApp para envio do comprovante (formato wa.me: 55 + número)
};

/* ---------- PRODUTOS ---------- */
/* Lista padrão (usada quando não há nada salvo no navegador).
   Para editar os produtos sem mexer no código, use a página admin.html */
const PRODUCTS_STORAGE_KEY = 'lattebuono_products';

const defaultProducts = [
    {
        id: 1,
        name: "Queijo Frescal",
        description: "Queijo frescal de leite de búfala, ideal para café da manha e lanches da tarde.",
        priceType: "fixed",
        price: 25,
        image: "images/queijo_frescal.jpg"
    },
    {
        id: 2,
        name: "Doce de Leite",
        description: "Doce de leite cremoso feito com leite de búfala. Perfeito para sobremesas.",
        priceType: "fixed",
        price: 20,
        image: "images/doce_de_leite.png"
    },
    {
        id: 3,
        name: "Mozzarella",
        description: "Mozzarella fresca de leite de búfala.",
        priceType: "fixed",
        price: 25,
        image: "images/mozzarella.png"
    },
    {
        id: 4,
        name: "Queijo Serra da Concórdia",
        description: "Queijo meia cura Serra da Concórdia.",
        priceType: "fixed",
        price: 15,
        image: "images/serra_da_concordia.jpg"
    }
];

/* Carrega os produtos salvos (pela página admin.html) ou usa os padrões */
const loadProducts = () => {
    try {
        const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Não foi possível carregar os produtos salvos. Usando os padrões.', e);
    }
    return defaultProducts.map(p => ({ ...p }));
};

let products = loadProducts();

/* ---------- ESTADO DO CARRINHO ---------- */
let cart = [];
let lastOrder = null; // Dados do último pedido finalizado (usados na tela de pagamento)

/* ---------- ELEMENTOS DO DOM ---------- */
let elements = {};

const initElements = () => {
    elements = {
        // Header
        header: document.getElementById('header'),
        menuToggle: document.getElementById('menuToggle'),
        nav: document.getElementById('nav'),
        
        // Carrinho
        cartBtn: document.getElementById('cartBtn'),
        cartFab: document.getElementById('cartFab'),
        cartCount: document.getElementById('cartCount'),
        fabCount: document.getElementById('fabCount'),
        cartSidebar: document.getElementById('cartSidebar'),
        cartOverlay: document.getElementById('cartOverlay'),
        cartClose: document.getElementById('cartClose'),
        cartItems: document.getElementById('cartItems'),
        cartSubtotal: document.getElementById('cartSubtotal'),
        cartFooter: document.getElementById('cartFooter'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        
        // Modal
        modalOverlay: document.getElementById('modalOverlay'),
        modalClose: document.getElementById('modalClose'),
        backToCart: document.getElementById('backToCart'),
        orderItems: document.getElementById('orderItems'),
        orderSubtotal: document.getElementById('orderSubtotal'),
        orderForm: document.getElementById('orderForm'),
        sendOrder: document.getElementById('sendOrder'),
        
        // Produtos
        productsGrid: document.getElementById('productsGrid'),

        // Pagamento (Pix)
        paymentOverlay: document.getElementById('paymentOverlay'),
        paymentClose: document.getElementById('paymentClose'),
        paymentCloseBtn: document.getElementById('paymentCloseBtn'),
        paymentTotal: document.getElementById('paymentTotal'),
        pixKeyDisplay: document.getElementById('pixKeyDisplay'),
        pixRecipientDisplay: document.getElementById('pixRecipientDisplay'),
        copyPixBtn: document.getElementById('copyPixBtn'),
        copyFeedback: document.getElementById('copyFeedback'),
        sendProofBtn: document.getElementById('sendProofBtn')
    };
};

/* ---------- UTILITÁRIOS ---------- */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: CONFIG.currency
    }).format(value);
};

const formatPrice = (product) => {
    if (product.priceType === 'fixed') {
        return formatCurrency(product.price);
    }
    return `${formatCurrency(product.priceMin)} – ${formatCurrency(product.priceMax)}`;
};

/* ---------- CARRINHO - FUNÇÕES ---------- */

// Adicionar produto ao carrinho
const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    showNotification(`${product.name} adicionado ao pedido!`);
};

// Remover produto do carrinho
const removeFromCart = (productId) => {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
};

// Alterar quantidade
const changeQuantity = (productId, delta) => {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
};

// Calcular subtotal
const calculateSubtotal = () => {
    let minTotal = 0;
    let maxTotal = 0;
    let hasRange = false;

    cart.forEach(item => {
        if (item.priceType === 'fixed') {
            minTotal += item.price * item.quantity;
            maxTotal += item.price * item.quantity;
        } else {
            minTotal += item.priceMin * item.quantity;
            maxTotal += item.priceMax * item.quantity;
            hasRange = true;
        }
    });

    return { minTotal, maxTotal, hasRange };
};

// Atualizar interface do carrinho
const updateCartUI = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const { minTotal, maxTotal, hasRange } = calculateSubtotal();

    // Atualizar contadores
    elements.cartCount.textContent = totalItems;
    elements.fabCount.textContent = totalItems;

    // Atualizar lista de itens
    if (cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <p>Seu pedido está vazio</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Adicione produtos para começar</p>
            </div>
        `;
        elements.cartFooter.style.display = 'none';
    } else {
        elements.cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${formatPrice(item)}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remover">×</button>
                    </div>
                </div>
            </div>
        `).join('');

        elements.cartFooter.style.display = 'block';
    }

    // Atualizar subtotal
    if (hasRange) {
        elements.cartSubtotal.textContent = `${formatCurrency(minTotal)} – ${formatCurrency(maxTotal)}`;
    } else {
        elements.cartSubtotal.textContent = formatCurrency(minTotal);
    }

    // Habilitar/desabilitar botão de finalizar
    elements.checkoutBtn.disabled = cart.length === 0;
};

/* ---------- RENDERIZAR PRODUTOS ---------- */
const renderProducts = () => {
    // Somente produtos visíveis aparecem no catálogo
    const visibleProducts = products.filter(p => p.visible !== false);

    elements.productsGrid.innerHTML = visibleProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-desc">${product.description}</p>
                <p class="product-price">
                    ${product.priceType === 'range' ? '<span class="price-label">de </span>' : ''}
                    ${formatPrice(product)}
                    ${product.priceType === 'range' ? '<span class="price-label"> (estimado)</span>' : ''}
                </p>
                <button class="product-btn" onclick="addToCart(${product.id})">
                    Adicionar ao pedido
                </button>
            </div>
        </div>
    `).join('');
};

/* ---------- MODAL - RESUMO DO PEDIDO ---------- */
const renderOrderSummary = () => {
    const { minTotal, maxTotal, hasRange } = calculateSubtotal();

    elements.orderItems.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.quantity}x ${item.name}</span>
            <span class="order-item-price">
                ${item.priceType === 'fixed' 
                    ? formatCurrency(item.price * item.quantity)
                    : `${formatCurrency(item.priceMin * item.quantity)} – ${formatCurrency(item.priceMax * item.quantity)}`
                }
            </span>
        </div>
    `).join('');

    if (hasRange) {
        elements.orderSubtotal.textContent = `${formatCurrency(minTotal)} – ${formatCurrency(maxTotal)}`;
    } else {
        elements.orderSubtotal.textContent = formatCurrency(minTotal);
    }
};

/* ---------- VALIDAÇÃO DO FORMULÁRIO ---------- */
const validateForm = () => {
    const requiredFields = ['nome', 'cep', 'rua', 'numero', 'bairro', 'cidade'];
    let isValid = true;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--color-error)';
            isValid = false;
        } else {
            field.style.borderColor = 'var(--color-border)';
        }
    });

    return isValid;
};

/* ---------- MASCARA CEP ---------- */
const formatCEP = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

/* ---------- MONTAR DADOS DO PEDIDO ---------- */
const buildOrderPayload = () => {
    const nome = document.getElementById('nome').value.trim();
    const cep = document.getElementById('cep').value.trim();
    const rua = document.getElementById('rua').value.trim();
    const numero = document.getElementById('numero').value.trim();
    const complemento = document.getElementById('complemento').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const observacao = document.getElementById('observacao').value.trim();

    const { minTotal } = calculateSubtotal();

    // Produtos: somente nome e quantidade (o valor total vai na coluna "Subtotal")
    const produtos = cart.map(item => `${item.quantity}x ${item.name}`).join('; ');

    return {
        nome,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        cep,
        produtos,
        subtotal: Number(minTotal.toFixed(2)),
        observacao
    };
};

/* ---------- ENVIAR PEDIDO PARA A PLANILHA (GOOGLE SHEETS) ---------- */
const sendOrderToSheet = async (payload) => {
    // O Apps Script nao aceita requisicoes JSON com preflight CORS, entao:
    // - mode: 'no-cors' (a resposta e opaca: o site nao consegue ler o retorno)
    // - Content-Type text/plain (evita o preflight e permite o envio)
    await fetch(CONFIG.appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });
};

/* ---------- FINALIZAR PEDIDO ---------- */
let sendingOrder = false;

const submitOrder = async () => {
    if (sendingOrder) return;

    if (!validateForm()) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (cart.length === 0) {
        showNotification('Seu pedido está vazio.', 'error');
        return;
    }

    sendingOrder = true;

    const payload = buildOrderPayload();

    try {
        await sendOrderToSheet(payload);

        // Pedido registrado na planilha: abre a tela de confirmação de pagamento
        closeModal();
        showPaymentConfirmation(payload);

        cart = [];
        updateCartUI();
    } catch (erro) {
        console.error('Erro ao enviar o pedido:', erro);
        showNotification('Não foi possível enviar o pedido. Tente novamente.', 'error');
    } finally {
        sendingOrder = false;
    }
};

/* ---------- PAGAMENTO VIA PIX ---------- */

// Formata a data/hora do pedido (horário de São Paulo, igual à planilha)
const formatOrderDate = () => {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date());
};

// Exibe a tela de confirmação do pedido com os dados do Pix
const showPaymentConfirmation = (payload) => {
    lastOrder = {
        nome: payload.nome,
        subtotal: payload.subtotal,
        dataHora: formatOrderDate()
    };

    elements.paymentTotal.textContent = formatCurrency(payload.subtotal);
    elements.pixKeyDisplay.textContent = CONFIG.pixKey;
    elements.pixRecipientDisplay.textContent = CONFIG.pixRecipient;

    // Reseta o feedback de cópia
    elements.copyFeedback.classList.remove('visible');

    elements.paymentOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Copia a chave Pix para a área de transferência
const copyPixKey = async () => {
    const key = CONFIG.pixKey;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(key);
        } else {
            // Fallback para contextos sem HTTPS (ex: arquivo local)
            const textarea = document.createElement('textarea');
            textarea.value = key;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
        }

        // Confirmação visual: "Chave Pix copiada!"
        elements.copyFeedback.classList.add('visible');
        setTimeout(() => {
            elements.copyFeedback.classList.remove('visible');
        }, 2500);
    } catch (erro) {
        console.error('Erro ao copiar a chave Pix:', erro);
        showNotification('Não foi possível copiar a chave Pix.', 'error');
    }
};

// Abre o WhatsApp com a mensagem do comprovante
const sendPaymentProof = () => {
    if (!lastOrder) return;

    const message =
        `Olá! Acabei de realizar um pedido na ${CONFIG.companyName}.\n\n` +
        `Nome: ${lastOrder.nome}\n` +
        `Valor do pedido: ${formatCurrency(lastOrder.subtotal)}\n` +
        `Data/hora do pedido: ${lastOrder.dataHora}\n\n` +
        `Estou enviando o comprovante do Pix para confirmar o pagamento.`;

    const whatsappURL = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
};

const closePaymentModal = () => {
    elements.paymentOverlay.classList.remove('active');
    document.body.style.overflow = '';
    lastOrder = null;
};

/* ---------- NOTIFICAÇÕES ---------- */
const showNotification = (message, type = 'success') => {
    // Remover notificação existente
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

/* ---------- EVENT LISTENERS ---------- */

const initEventListeners = () => {
    // Menu mobile
    elements.menuToggle.addEventListener('click', () => {
        elements.nav.classList.toggle('active');
        elements.menuToggle.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            elements.nav.classList.remove('active');
            elements.menuToggle.classList.remove('active');
        });
    });

    // Carrinho
    elements.cartBtn.addEventListener('click', () => {
        elements.cartSidebar.classList.add('active');
        elements.cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    elements.cartFab.addEventListener('click', () => {
        elements.cartSidebar.classList.add('active');
        elements.cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    elements.cartClose.addEventListener('click', closeCart);
    elements.cartOverlay.addEventListener('click', closeCart);

    // Modal
    elements.checkoutBtn.addEventListener('click', () => {
        renderOrderSummary();
        elements.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    elements.modalClose.addEventListener('click', closeModal);
    elements.backToCart.addEventListener('click', closeModal);

    // Fechar modal ao clicar fora
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });

    // Enviar pedido para a planilha (Google Sheets)
    elements.sendOrder.addEventListener('click', submitOrder);

    // Pagamento (Pix)
    elements.copyPixBtn.addEventListener('click', copyPixKey);
    elements.sendProofBtn.addEventListener('click', sendPaymentProof);
    elements.paymentClose.addEventListener('click', closePaymentModal);
    elements.paymentCloseBtn.addEventListener('click', closePaymentModal);

    // Fechar modal de pagamento ao clicar fora
    elements.paymentOverlay.addEventListener('click', (e) => {
        if (e.target === elements.paymentOverlay) {
            closePaymentModal();
        }
    });

    // Máscara CEP
    document.getElementById('cep').addEventListener('input', (e) => {
        e.target.value = formatCEP(e.target.value);
    });

    // Header scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            elements.header.classList.add('scrolled');
        } else {
            elements.header.classList.remove('scrolled');
        }
    });

    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeModal();
            closePaymentModal();
        }
    });
};

const closeCart = () => {
    elements.cartSidebar.classList.remove('active');
    elements.cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

const closeModal = () => {
    elements.modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
};

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    renderProducts();
    updateCartUI();
    
    // Adicionar animação de fade-in aos elementos
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
});

/* ---------- FUNÇÕES GLOBAIS (para uso no HTML) ---------- */
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQuantity = changeQuantity;
