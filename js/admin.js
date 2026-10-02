/* ============================================
   LATTE BUONO - GERENCIADOR DE PRODUTOS
   Salva os produtos no localStorage (mesma chave
   usada pelo script.js) para não precisar editar
   o código a cada alteração.
   ============================================ */

const STORAGE_KEY = 'lattebuono_products';

/* Lista padrão — usada ao restaurar ou quando não há nada salvo */
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

/* ---------- ESTADO ---------- */
let products = loadProducts();
let editingId = null;

/* ---------- ELEMENTOS ---------- */
const el = {
    list: document.getElementById('productList'),
    count: document.getElementById('productCount'),
    form: document.getElementById('productForm'),
    formTitle: document.getElementById('formTitle'),
    saveBtn: document.getElementById('saveBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    id: document.getElementById('productId'),
    name: document.getElementById('name'),
    description: document.getElementById('description'),
    priceType: document.getElementById('priceType'),
    price: document.getElementById('price'),
    image: document.getElementById('image'),
    imagePreview: document.getElementById('imagePreview'),
    badge: document.getElementById('badge'),
    visible: document.getElementById('visible'),
    resetBtn: document.getElementById('resetBtn'),
    toast: document.getElementById('toast')
};

/* ---------- PERSISTÊNCIA ---------- */
function loadProducts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Não foi possível carregar os produtos salvos.', e);
    }
    return defaultProducts.map(p => ({ ...p }));
}

function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

/* ---------- UTILITÁRIOS ---------- */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatPrice = (product) => {
    if (product.priceType === 'fixed') {
        return formatCurrency(product.price);
    }
    return `${formatCurrency(product.priceMin)} – ${formatCurrency(product.priceMax)}`;
};

const escapeHTML = (str) => {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
};

function nextId() {
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
}

function showToast(message, type = 'success') {
    el.toast.textContent = message;
    el.toast.className = `toast toast-${type} toast-visible`;
    setTimeout(() => {
        el.toast.classList.remove('toast-visible');
    }, 2800);
}

/* ---------- RENDERIZAR LISTA ---------- */
function renderList() {
    const totalCount = products.length;
    const visibleCount = products.filter(p => p.visible !== false).length;
    el.count.textContent = totalCount;

    if (totalCount === 0) {
        el.list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>Nenhum produto cadastrado</p>
                <p class="empty-hint">Use o formulário ao lado para adicionar um produto.</p>
            </div>
        `;
        return;
    }

    el.list.innerHTML = `
        <p class="list-subtitle">${visibleCount} visível${visibleCount !== 1 ? 'is' : ''} no site · ${totalCount - visibleCount} oculto${totalCount - visibleCount !== 1 ? 's' : ''}</p>
        ${products.map(product => {
            const isHidden = product.visible === false;
            return `
            <div class="product-item ${isHidden ? 'is-hidden' : ''}" data-id="${product.id}">
                <div class="product-thumb">
                    <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}"
                         onerror="this.parentElement.classList.add('thumb-error'); this.remove();">
                </div>
                <div class="product-info">
                    <div class="product-name-row">
                        <span class="product-name">${escapeHTML(product.name)}</span>
                        ${product.badge ? `<span class="product-badge">${escapeHTML(product.badge)}</span>` : ''}
                        ${isHidden ? '<span class="product-status hidden-status">Oculto</span>' : '<span class="product-status visible-status">Visível</span>'}
                    </div>
                    <p class="product-desc">${escapeHTML(product.description)}</p>
                    <span class="product-price">${formatPrice(product)}</span>
                </div>
                <div class="product-actions">
                    <button class="action-btn action-visibility" onclick="toggleVisibility(${product.id})" title="${isHidden ? 'Mostrar no site' : 'Ocultar do site'}" aria-label="${isHidden ? 'Mostrar' : 'Ocultar'} ${escapeHTML(product.name)}">
                        ${isHidden ? '🙈' : '👁️'}
                    </button>
                    <button class="action-btn action-edit" onclick="editProduct(${product.id})" title="Editar" aria-label="Editar ${escapeHTML(product.name)}">
                        ✏️
                    </button>
                    <button class="action-btn action-remove" onclick="removeProduct(${product.id})" title="Remover" aria-label="Remover ${escapeHTML(product.name)}">
                        🗑️
                    </button>
                </div>
            </div>
        `}).join('')}
    `;
}

/* ---------- FORMULÁRIO ---------- */
function updateImagePreview() {
    const src = el.image.value.trim();
    if (!src) {
        el.imagePreview.style.display = 'none';
        el.imagePreview.innerHTML = '';
        return;
    }
    el.imagePreview.style.display = 'block';
    el.imagePreview.innerHTML = `<img src="${escapeHTML(src)}" alt="Pré-visualização" onerror="this.parentElement.style.display='none';">`;
}

function resetForm() {
    editingId = null;
    el.form.reset();
    el.id.value = '';
    el.visible.checked = true;
    el.formTitle.textContent = 'Adicionar produto';
    el.saveBtn.textContent = 'Adicionar produto';
    el.cancelBtn.style.display = 'none';
    el.imagePreview.style.display = 'none';
    el.imagePreview.innerHTML = '';
}

function fillForm(product) {
    editingId = product.id;
    el.id.value = product.id;
    el.name.value = product.name;
    el.description.value = product.description;
    el.priceType.value = product.priceType;
    el.price.value = product.price !== undefined && product.price !== null ? product.price : '';
    el.image.value = product.image;
    el.badge.value = product.badge || '';
    el.visible.checked = product.visible !== false;
    el.formTitle.textContent = 'Editar produto';
    el.saveBtn.textContent = 'Salvar alterações';
    el.cancelBtn.style.display = 'inline-flex';
    updateImagePreview();
}

/* ---------- AÇÕES ---------- */
function submitForm(e) {
    e.preventDefault();

    const name = el.name.value.trim();
    const description = el.description.value.trim();
    const priceType = el.priceType.value;
    const image = el.image.value.trim();
    const badge = el.badge.value.trim();

    if (!name || !description || !image) {
        showToast('Preencha nome, descrição e imagem.', 'error');
        return;
    }

    const product = {
        name,
        description,
        priceType,
        image,
        badge: badge || undefined,
        visible: el.visible.checked
    };

    const price = parseFloat(el.price.value);
    if (isNaN(price) || price < 0) {
        showToast('Informe um preço válido.', 'error');
        return;
    }
    product.price = price;

    if (editingId !== null) {
        const index = products.findIndex(p => p.id === editingId);
        if (index === -1) {
            showToast('Produto não encontrado.', 'error');
            return;
        }
        products[index] = { id: editingId, ...product };
        showToast(`"${name}" atualizado!`);
    } else {
        products.push({ id: nextId(), ...product });
        showToast(`"${name}" adicionado!`);
    }

    saveProducts();
    renderList();
    resetForm();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    fillForm(product);
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.name.focus();
}

function removeProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (!confirm(`Remover "${product.name}"? Esta ação não pode ser desfeita.`)) return;

    products = products.filter(p => p.id !== id);

    // Se estava editando o produto removido, limpa o formulário
    if (editingId === id) {
        resetForm();
    }

    saveProducts();
    renderList();
    showToast(`"${product.name}" removido.`);
}

function toggleVisibility(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    product.visible = product.visible === false ? true : false;

    saveProducts();
    renderList();
    showToast(product.visible
        ? `"${product.name}" agora visível no site.`
        : `"${product.name}" ocultado do site.`);
}

function resetDefaults() {
    if (!confirm('Restaurar a lista padrão de produtos? Todas as alterações feitas aqui serão perdidas.')) return;

    products = defaultProducts.map(p => ({ ...p }));
    saveProducts();
    renderList();
    resetForm();
    showToast('Produtos padrão restaurados.');
}

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener('DOMContentLoaded', () => {
    el.form.addEventListener('submit', submitForm);
    el.image.addEventListener('input', updateImagePreview);
    el.cancelBtn.addEventListener('click', resetForm);
    el.resetBtn.addEventListener('click', resetDefaults);

    renderList();
});

/* Funções globais para os botões da lista */
window.editProduct = editProduct;
window.removeProduct = removeProduct;
window.toggleVisibility = toggleVisibility;
