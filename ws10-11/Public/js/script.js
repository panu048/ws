let cart = JSON.parse(localStorage.getItem('cart')) || [];

function applyTheme(t) {
    if (t === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
}

function updateCartCountUI() {
    const navCartCount = document.getElementById('navCartCount');
    if (navCartCount) {
        const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        navCartCount.textContent = totalCount;
    }
}

function addToCart(product) {
    if (!product) return;

    const productId = product._id || product.id || product.name;
    const existingItem = cart.find(item =>
        (item._id && item._id === productId) || item.name === product.name
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: productId,
            name: product.name || 'ไม่มีชื่อสินค้า',
            price: Number(product.price) || 0,
            type: product.type || '',
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountUI();
    alert(`เพิ่ม "${product.name}" ลงในตะกร้าเรียบร้อยแล้ว`);
}

async function loadMenu(filter = 'all') {
    const container = document.getElementById('menu-container');
    if (!container) return;

    try {
        container.innerHTML = '<p style="text-align:center;">กำลังโหลดรายการสินค้า...</p>';

        const response = await fetch(`${API_BASE}/api/menu/${filter}`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.replace('login.html');
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }

        const menuItems = await response.json();

        if (!Array.isArray(menuItems) || menuItems.length === 0) {
            container.innerHTML = '<p style="text-align:center;">ไม่พบรายการสินค้าในหมวดหมู่นี้</p>';
            return;
        }

        container.innerHTML = '';

        menuItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';

            const priceNum = Number(item.price) || 0;
            const itemType = item.type ? ` (${item.type})` : '';

            itemDiv.innerHTML = `
                <img class="menu-image" src="/img/${item.name}.jpg" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=NPRU+Cafe'" />
                <h3>${item.name}</h3>
                <p>ประเภท: <span class="type">${item.cat || item.category || 'ทั่วไป'}${itemType}</span></p>
                <p>ราคา: <span class="price">${priceNum.toFixed(2)} บาท</span></p>
                <div class="action-buttons">
                    <button type="button" class="order-button">ใส่ตะกร้า</button>
                </div>
            `;

            container.appendChild(itemDiv);

            itemDiv.querySelector('.order-button')?.addEventListener('click', () => addToCart(item));
        });
    } catch (error) {
        console.error('Error loading menu:', error);
        container.innerHTML = '<p style="text-align:center; color:red;">ไม่สามารถโหลดข้อมูลสินค้าได้</p>';
    }
}

const API_BASE = (window.location.port === '3000' || window.location.port === '') ? '' : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    // สำคัญ: sid เป็น HttpOnly Cookie จึงต้องถาม Server แทนการอ่าน document.cookie
    try {
        const response = await fetch(`${API_BASE}/api/users/info`, {
            method: 'GET',
            credentials: 'include'
        });

        const session = await response.json();

        if (!session.isLoggedIn) {
            window.location.replace('login.html');
            return;
        }

        const username = session.username || '-';
        const theme = session.theme || 'light';

        // แสดงปุ่มจัดการสินค้าเฉพาะ Admin
        const adminButton = document.querySelector('a[href="admin.html"]');
        if (adminButton) {
            const isAdmin = String(session.type || '').toLowerCase() === 'admin';
            adminButton.style.display = isAdmin ? '' : 'none';
            adminButton.setAttribute('aria-hidden', isAdmin ? 'false' : 'true');
        }

        const displayNameEl = document.getElementById('displayName');
        const displayThemeEl = document.getElementById('displayTheme');
        const switchThemeEl = document.getElementById('switchTheme');

        if (displayNameEl) displayNameEl.textContent = username;
        if (displayThemeEl) displayThemeEl.textContent = theme;
        if (switchThemeEl) switchThemeEl.value = theme;

        applyTheme(theme);

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch(`${API_BASE}/api/users/logout`, {
                        method: 'POST',
                        credentials: 'include'
                    });
                } catch (err) {
                    console.error('Logout error:', err);
                }
                window.location.replace('login.html');
            });
        }

        if (switchThemeEl) {
            switchThemeEl.addEventListener('change', async (e) => {
                const selectedTheme = e.target.value;
                applyTheme(selectedTheme);
                if (displayThemeEl) displayThemeEl.textContent = selectedTheme;

                // อัปเดต Theme ใน Session ด้วย โดย Login ใหม่ไม่จำเป็น
                try {
                    await fetch(`${API_BASE}/api/users/theme`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ theme: selectedTheme })
                    });
                } catch (err) {
                    console.warn('ไม่สามารถบันทึก Theme:', err);
                }
            });
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', e => loadMenu(e.target.id));
        });

        updateCartCountUI();
        loadMenu('all');
    } catch (error) {
        console.error('Session check error:', error);
        window.location.replace('login.html');
    }
});
