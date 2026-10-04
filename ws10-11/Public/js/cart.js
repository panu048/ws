let cart = JSON.parse(localStorage.getItem('cart')) || [];

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function applyTheme(t) {
    if (t === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function changeQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

function removeFromCart(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        saveCart();
    }
}

function updateCartUI() {
    const cartItemsList = document.getElementById('cart-items-list');
    const totalCountEl = document.getElementById('cart-total-count');
    const totalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p class="empty-cart-msg">ยังไม่มีสินค้าในตะกร้า</p>';
        totalCountEl.textContent = '0';
        totalPriceEl.textContent = '0.00';
        checkoutBtn.disabled = true;
        return;
    }

    cartItemsList.innerHTML = '';
    let totalCount = 0;
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalCount += item.quantity;
        totalPrice += itemTotal;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row';
        itemRow.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name} ${item.type ? `(${item.type})` : ''}</strong><br>
                <span>${item.price.toFixed(2)} x ${item.quantity} = ${itemTotal.toFixed(2)} บาท</span>
            </div>
            <div class="cart-item-controls">
                <button type="button" onclick="changeQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button type="button" onclick="changeQuantity(${index}, 1)">+</button>
                <button type="button" class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>
        `;
        cartItemsList.appendChild(itemRow);
    });

    totalCountEl.textContent = totalCount;
    totalPriceEl.textContent = totalPrice.toFixed(2);
    checkoutBtn.disabled = false;
}

async function handleCheckout() {
    if (cart.length === 0) return;

    const checkoutBtn = document.getElementById('checkout-btn');
    const totalPrice = parseFloat(document.getElementById('cart-total-price').textContent);
    const totalCount = parseInt(document.getElementById('cart-total-count').textContent);

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'กำลังบันทึกสั่งซื้อ...';

    const orderData = {
        items: cart.map(item => ({
            menuId: item._id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity),
            type: item.type || ''
        })),
        totalPrice: totalPrice,
        totalCount: totalCount
    };

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert('สั่งซื้อสำเร็จ! บันทึกลงฐานข้อมูลเรียบร้อยแล้ว');
            cart = [];
            localStorage.removeItem('cart');
            updateCartUI();
        } else {
            const result = await response.json();
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
        checkoutBtn.textContent = 'ชำระเงิน / สั่งซื้อ';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE = (window.location.port === '3000' || window.location.port === '')
        ? ''
        : 'http://localhost:3000';

    // sid เป็น HttpOnly Cookie จึงต้องตรวจ Session ผ่าน Server
    try {
        const response = await fetch(`${API_BASE}/api/users/info`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Session check failed: ${response.status}`);
        }

        const session = await response.json();

        if (!session.isLoggedIn) {
            window.location.replace('login.html');
            return;
        }

        const displayNameEl = document.getElementById('displayName');
        if (displayNameEl) {
            displayNameEl.textContent = session.username || '-';
        }

        applyTheme(session.theme || 'light');

        // Logout ต้องให้ Server ลบ Session และ sid Cookie
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

                localStorage.removeItem('cart');
                window.location.replace('login.html');
            });
        }

        document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);

        updateCartUI();
    } catch (error) {
        console.error('Session check error:', error);
        window.location.replace('login.html');
    }
});
