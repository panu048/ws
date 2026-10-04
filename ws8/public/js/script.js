// ================================
// 1. ตะกร้าสินค้า (เพิ่มตาม Workshop 8)
// ================================
let cart = [];


// ================================
// 3. โหลดและจัดการเมนูอาหาร (API Connection)
// ================================

async function loadMenu(filter = "all") {
    try {
        const response = await fetch(`http://localhost:3000/api/menu/${filter}`);
        const menuItems = await response.json();
        const container = document.getElementById('menu-container');
        
        if (!container) return;
        container.innerHTML = '';

        menuItems.forEach(item => {
            const ItemDiv = document.createElement('div');
            ItemDiv.className = 'menu-item';
            ItemDiv.innerHTML = `
                <img class="menu-image" src="./img/${item.name}.jpg" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
                <h3>${item.name}</h3>
                <p>ราคา <span class="price">${Number(item.price).toFixed(2)}</span> บาท</p>
                <p>ประเภท <span class="type">${item.type || '-'}</span></p>
                <div class="action-buttons">
                    <button class="order-button" data-id="${item._id}">สั่งซื้อ</button>
                    <button class="delete-button" data-id="${item._id}">ลบ</button>
                    <button class="edit-button" data-id="${item._id}">แก้ไขราคา</button>
                </div>
            `;
            container.appendChild(ItemDiv);

            // ปุ่มสั่งซื้อ: เพิ่มสินค้าลงตะกร้า
            const orderButton = ItemDiv.querySelector('.order-button');
            orderButton.addEventListener('click', () => {
                addToCart(item);
                alert(`เพิ่ม ${item.name} ลงตะกร้าแล้ว`);
            });

            // ปุ่มลบเมนู
            const deleteButton = ItemDiv.querySelector('.delete-button');
            deleteButton.addEventListener('click', async () => {
                const id = deleteButton.getAttribute('data-id');
                if (confirm('คุณต้องการลบเมนูนี้หรือไม่?')) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/menu/${id}`, { method: 'DELETE' });
                        if (!response.ok) {
                            alert('เกิดข้อผิดพลาดในการลบเมนู');
                        }
                    } catch (error) {
                        console.error('Error deleting menu item:', error);
                    }
                    loadMenu(filter);
                }
            });

            // ปุ่มแก้ไขราคา
            const editButton = ItemDiv.querySelector('.edit-button');
            editButton.addEventListener('click', () => {
                const id = editButton.getAttribute('data-id');
                if (ItemDiv.querySelector('.edit-form')) return;

                const editForm = document.createElement('form');
                editForm.className = 'edit-form';
                editForm.style.padding = '10px';
                editForm.innerHTML = `
                    <input type="number" name="price" value="${item.price}" step="0.01" required style="width: 70px; padding: 4px;" />
                    <button type="submit">บันทึก</button>
                `;
                ItemDiv.appendChild(editForm);

                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const price = parseFloat(editForm.querySelector('input[name="price"]').value);
                    try {
                        const response = await fetch(`http://localhost:3000/api/menu/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ price })
                        });
                        if (response.ok) {
                            alert('แก้ไขราคาเรียบร้อยแล้ว');
                            loadMenu(filter);
                        } else {
                            alert('เกิดข้อผิดพลาดในการแก้ไขราคา');
                        }
                    } catch (error) {
                        console.error('Error updating menu item:', error);
                        alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                    }
                });
            });

        });
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// ฟังก์ชันส่งข้อมูลเพิ่มเมนูใหม่เข้าเซิร์ฟเวอร์
async function handleAddMenu(event) {
    event.preventDefault(); // ป้องกันไม่ให้หน้าเว็บ รีเฟรช ตัวเอง

    const nameInput = document.getElementById('name');
    const priceInput = document.getElementById('price');
    const typeInput = document.getElementById('type');
     const catInput = document.getElementById('cat');

    // เตรียมโครงสร้างข้อมูลส่งไปยัง API
    const newProduct = {
        name: nameInput.value.trim(),
        price: parseFloat(priceInput.value),
        type: typeInput.value,
        cat: catInput.value
    };

    try {
        const response = await fetch('http://localhost:3000/api/menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            alert('เพิ่มเมนูสำเร็จ!');
            
            // ล้างข้อมูลในช่องกรอก
            document.getElementById('add-menu-form').reset();
            
            // โหลดรายการเมนูใหม่เพื่ออัปเดตหน้าจอ
            loadMenu('all'); 
        } else {
            const errorData = await response.json();
            alert(`เกิดข้อผิดพลาด: ${errorData.message || 'ไม่สามารถเพิ่มเมนูได้'}`);
        }
    } catch (error) {
        console.error('Error adding menu:', error);
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}


// ================================
// 3. ตะกร้าสินค้าและการสั่งซื้อ (เพิ่มตาม Workshop 8)
// ================================

function addToCart(product) {
    const existingItem = cart.find(item => item._id === product._id || item.name === product.name);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            _id: product._id,
            name: product.name,
            price: Number(product.price),
            type: product.type || '',
            quantity: 1
        });
    }

    updateCartUI();
}

function updateCartUI() {
    const cartItemsList = document.getElementById('cart-items-list');
    const totalCountEl = document.getElementById('cart-total-count');
    const totalPriceEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsList || !totalCountEl || !totalPriceEl || !checkoutBtn) return;

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

function changeQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartUI();
    }
}

function removeFromCart(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        updateCartUI();
    }
}

async function handleCheckout() {
    if (cart.length === 0) {
        alert('ไม่มีสินค้าในตะกร้า');
        return;
    }

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
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('สั่งซื้อสำเร็จ! บันทึกลงฐานข้อมูลเรียบร้อยแล้ว');
            cart = [];
            updateCartUI();
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
        checkoutBtn.textContent = 'ชำระเงิน';
        if (cart.length > 0) checkoutBtn.disabled = false;
    }
}

// ================================
// 4. Event Listeners เมื่อโหลดหน้าเว็บ
// ================================

document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterCategory = e.target.id;
            loadMenu(filterCategory);
        });
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    const addMenuForm = document.getElementById('add-menu-form');
    if (addMenuForm) {
        addMenuForm.addEventListener('submit', handleAddMenu);
    }

    loadMenu('all');
});