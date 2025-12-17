document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const apiBase = 'https://vegan-backend-1zi7.onrender.com/api/products/';
    
    // --- STATE ---
    let currentPage = 1;
    let currentCategory = null;
    let currentStatus = null;
    let currentVendor = getVendorFromQuery();
    let isFetching = false;

    // --- DOM ---
    const productContainer = document.getElementById('product-container');
    const categoryContainer = document.getElementById('category-container');
    const statusSelect = document.getElementById('status-select');
    const loadingMessage = document.getElementById('loading-message');
    const vendorFilterMessage = document.getElementById('vendor-filter-message');
    const loadMoreContainer = document.getElementById('load-more-container');
    const loadMoreBtn = document.getElementById('load-more-btn');

    // --- HELPERS ---
    function getVendorFromQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('vendor');
    }

    // --- CATEGORY FETCH ---
    function fetchCategories() {
        fetch(`${apiBase}categories/`)
            .then(res => res.json())
            .then(categories => {
                if (!categoryContainer) return;
                categoryContainer.innerHTML = '';

                const allBtn = createCategoryButton('All', null);
                setActiveButton(allBtn);
                categoryContainer.appendChild(allBtn);

                categories.forEach(cat => {
                    categoryContainer.appendChild(
                        createCategoryButton(cat, cat)
                    );
                });
            })
            .catch(err => console.error('Category fetch failed', err));
    }

    function createCategoryButton(label, value) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className =
            'px-4 py-2 rounded-full text-sm transition bg-[#2a2f2c] text-gray-300 hover:bg-[#353b37]';

        btn.addEventListener('click', () => {
            categoryContainer.querySelectorAll('button').forEach(b =>
                b.classList.remove('bg-primary', 'text-black')
            );

            btn.classList.add('bg-primary', 'text-black');

            currentCategory = value;
            currentPage = 1;
            productContainer.innerHTML = '';
            fetchProducts();
        });

        return btn;
    }

    function setActiveButton(btn) {
        btn.classList.add('bg-primary', 'text-black');
    }

    // --- STATUS FILTER ---
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            currentStatus = statusSelect.value || null;
            currentPage = 1;
            productContainer.innerHTML = '';
            fetchProducts();
        });
    }

    // --- FETCH PRODUCTS ---
    async function fetchProducts() {
        if (isFetching) return;
        isFetching = true;

        if (currentPage === 1) {
            loadingMessage.style.display = 'block';
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreBtn.textContent = 'Loading...';
        }

        let url = new URL(apiBase);
        url.searchParams.append('page', currentPage);

        if (currentVendor) {
            url.searchParams.append('vendor', currentVendor);
            vendorFilterMessage.style.display = 'block';
            vendorFilterMessage.innerHTML = `Showing products from <b>${currentVendor}</b>`;
        }

        if (currentCategory) url.searchParams.append('category', currentCategory);
        if (currentStatus) url.searchParams.append('status', currentStatus);

        try {
            const res = await fetch(url);
            const data = await res.json();

            loadingMessage.style.display = 'none';
            loadMoreBtn.textContent = 'Load More';
            isFetching = false;

            if (currentPage === 1 && data.results.length === 0) {
                productContainer.innerHTML = `
                    <p class="col-span-full text-center text-gray-500 py-12">
                        No products found.
                    </p>`;
                loadMoreContainer.style.display = 'none';
                return;
            }

            renderProductCards(data.results);
            loadMoreContainer.style.display = data.has_next ? 'block' : 'none';

        } catch (err) {
            console.error(err);
            loadingMessage.textContent = 'Error loading products.';
            isFetching = false;
        }
    }

    // --- RENDER CARDS (PRICE REMOVED) ---
    function renderProductCards(products) {
        products.forEach(product => {
            const card = document.createElement('div');
            card.className =
                'bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition overflow-hidden flex flex-col';

            const status = (product.vegan_status || '')
                .toLowerCase()
                .replace(/[\s-]/g, '_');

            let badge = 'bg-gray-100 text-gray-600';
            let label = 'Unknown';

            if (status === 'vegan') {
                badge = 'bg-green-100 text-green-700';
                label = 'Vegan';
            } else if (status === 'non_vegan') {
                badge = 'bg-red-100 text-red-700';
                label = 'Not Vegan';
            }

            card.innerHTML = `
                <div class="relative h-48">
                    <img src="${product.image_url || 'https://placehold.co/600x400'}"
                         class="w-full h-full object-cover">
                    <span class="absolute top-3 right-3 px-3 py-1 text-xs font-bold rounded-full ${badge}">
                        ${label}
                    </span>
                </div>

                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="font-bold mb-3">${product.name}</h3>

                <div class="mt-auto flex justify-end">
                    <a href="${product.product_link}" target="_blank"
                    class="px-4 py-2 bg-primary text-black rounded-lg text-sm">
                        View Product
                    </a>
                </div>

                </div>
            `;

            productContainer.appendChild(card);
        });
    }

    // --- LOAD MORE ---
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            fetchProducts();
        });
    }

    // --- INIT ---
    fetchCategories();
    fetchProducts();
});
 