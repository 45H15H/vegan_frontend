document.addEventListener('DOMContentLoaded', () => {
    const productContainer = document.getElementById('product-container');
    const loadingMessage = document.getElementById('loading-message');
    const vendorFilterMessage = document.getElementById('vendor-filter-message');
    const categoryContainer = document.getElementById('category-container');
    // The URL for your running Django API server
    const apiUrl = 'https://vegan-backend-1zi7.onrender.com/api/products/';

    // Helper to get vendor from query string
    function getVendorFromQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('vendor');
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            loadingMessage.style.display = 'none'; // Hide the loading message

            const vendor = getVendorFromQuery();
            // keep state for category filtering
            let activeCategory = null;

            // build unique category list from API (ignore empty/null)
            const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

            function renderCategories(categories) {
                if (!categoryContainer) return;
                categoryContainer.innerHTML = '';

                // Add an "All" option
                const allBtn = document.createElement('button');
                allBtn.textContent = 'All';
                allBtn.className = 'px-3 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200';
                allBtn.addEventListener('click', () => {
                    activeCategory = null;
                    document.querySelectorAll('#category-container button').forEach(b => b.classList.remove('ring-2','ring-primary'));
                    allBtn.classList.add('ring-2','ring-primary');
                    renderProducts();
                });
                categoryContainer.appendChild(allBtn);

                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.textContent = cat;
                    btn.className = 'px-3 py-2 rounded bg-white dark:bg-gray-900 hover:bg-gray-50';
                    btn.addEventListener('click', () => {
                        activeCategory = cat;
                        document.querySelectorAll('#category-container button').forEach(b => b.classList.remove('ring-2','ring-primary'));
                        btn.classList.add('ring-2','ring-primary');
                        renderProducts();
                    });
                    categoryContainer.appendChild(btn);
                });
            }

            function renderProducts() {
                let filteredProducts = products.slice();

                if (vendor) {
                    filteredProducts = filteredProducts.filter(product => {
                        return product.vendor && product.vendor.toLowerCase() === vendor.toLowerCase();
                    });
                    vendorFilterMessage.style.display = 'block';
                    vendorFilterMessage.textContent = `Showing products for vendor: ${vendor}`;
                } else {
                    vendorFilterMessage.style.display = 'none';
                }

                if (activeCategory) {
                    filteredProducts = filteredProducts.filter(p => p.category && p.category === activeCategory);
                }

                if (filteredProducts.length === 0) {
                    productContainer.innerHTML = '<p>No products found.</p>';
                    return;
                }

                productContainer.innerHTML = '';
                filteredProducts.forEach(product => {
                    const card = document.createElement('div');
                    card.className = 'bg-white dark:bg-gray-800 rounded-lg shadow p-4';

                    const price = (product.price !== undefined && product.price !== null && product.price !== '') ? `₹${parseFloat(product.price).toFixed(2)}` : '';
                    const description = product.description || 'No description available.';
                    const image = product.image_url || product.image || 'https://placehold.co/600x400?text=No+Image';
                    const link = product.product_link || product.link || '#';
                    const vegan = product.vegan_status || product.vegan || 'unknown';
                    const category = product.category || 'Uncategorized';

                    // choose badge color
                    let badgeClasses = 'inline-block px-2 py-1 text-xs rounded-full';
                    let badgeText = String(vegan).toLowerCase();
                    if (badgeText === 'vegan' || badgeText === 'yes' || badgeText === 'true') {
                        badgeClasses += ' bg-green-100 text-green-800';
                        badgeText = 'Vegan';
                    } else if (badgeText === 'non-vegan' || badgeText === 'not vegan' || badgeText === 'no' || badgeText === 'false') {
                        badgeClasses += ' bg-red-100 text-red-800';
                        badgeText = 'Not Vegan';
                    } else {
                        badgeClasses += ' bg-gray-100 text-gray-800';
                        badgeText = 'Unknown';
                    }

                    card.innerHTML = `
                        <div class="w-full h-48 overflow-hidden rounded-md mb-3">
                            <img src="${image}" alt="${product.name || ''}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400?text=Image+Error';">
                        </div>
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold">${product.name || 'Unnamed Product'}</h3>
                                <p class="text-sm text-gray-600 dark:text-gray-300 my-2">${description}</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Category: <strong>${category}</strong></p>
                            </div>
                            <div class="flex flex-col items-end gap-2">
                                <span class="${badgeClasses}">${badgeText}</span>
                                <p class="text-lg font-bold">${price}</p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <a href="${link}" target="_blank" class="inline-block bg-primary text-white px-4 py-2 rounded">View Product</a>
                        </div>
                    `;

                    productContainer.appendChild(card);
                });
            }

            // render categories and products initially
            renderCategories(allCategories);
            // mark "All" as selected by default
            const firstBtn = categoryContainer && categoryContainer.querySelector('button');
            if (firstBtn) firstBtn.classList.add('ring-2','ring-primary');
            renderProducts();
        })
        .catch(error => {
            loadingMessage.style.display = 'none'; // Hide loading message on error too
            console.error('Error fetching products:', error);
            productContainer.innerHTML = '<p class="error-message">Failed to load products. Please make sure the backend server is running and check the console for details.</p>';
        });
});