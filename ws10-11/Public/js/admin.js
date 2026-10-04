function applyTheme(t) {
    if (t === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
}

const API = 'http://localhost:3000';

async function getSession() {
    const response = await fetch(`${API}/api/users/info`, {
        credentials: 'include'
    });

    if (!response.ok) return null;
    return response.json();
}

async function loadAdminMenu() {
    try {
        const response = await fetch(`${API}/api/menu/all`, {
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
            alert('ไม่มีสิทธิ์เข้าใช้งานหน้าจัดการสินค้า');
            window.location.href = 'index.html';
            return;
        }

        if (!response.ok) throw new Error('โหลดรายการสินค้าไม่สำเร็จ');

        const menuItems = await response.json();
        const container = document.getElementById('admin-menu-list');
        if (!container) return;

        container.innerHTML = '';
        menuItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.style.padding = '12px 0';
            row.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong> (${item.cat || '-'})<br>
                    <span>ราคาปัจจุบัน: ${Number(item.price).toFixed(2)} บาท | ประเภท: ${item.type || '-'}</span>
                </div>
                <div class="action-buttons" style="padding:0;">
                    <button class="edit-button" data-id="${item._id}">แก้ไขราคา</button>
                    <button class="delete-button" data-id="${item._id}">ลบ</button>
                </div>
            `;
            container.appendChild(row);

            row.querySelector('.delete-button').addEventListener('click', async () => {
                if (!confirm(`คุณต้องการลบ "${item.name}" ใช่หรือไม่?`)) return;

                const res = await fetch(`${API}/api/menu/${item._id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (res.ok) {
                    loadAdminMenu();
                } else {
                    const data = await res.json().catch(() => ({}));
                    alert(data.message || 'ไม่สามารถลบสินค้าได้');
                }
            });

            row.querySelector('.edit-button').addEventListener('click', () => {
                if (row.querySelector('.edit-form')) return;

                const editForm = document.createElement('form');
                editForm.className = 'edit-form';
                editForm.style.marginTop = '8px';
                editForm.innerHTML = `
                    <input type="number" name="price" value="${item.price}" step="0.01" required style="width: 100px; padding: 4px;" />
                    <button type="submit" class="submit-btn" style="width: auto; padding: 4px 10px;">บันทึก</button>
                `;
                row.querySelector('.cart-item-info').appendChild(editForm);

                editForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const newPrice = parseFloat(editForm.querySelector('input[name="price"]').value);

                    const res = await fetch(`${API}/api/menu/${item._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ price: newPrice })
                    });

                    if (res.ok) {
                        alert('แก้ไขราคาเรียบร้อยแล้ว');
                        loadAdminMenu();
                    } else {
                        const data = await res.json().catch(() => ({}));
                        alert(data.message || 'ไม่สามารถแก้ไขสินค้าได้');
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error loading admin menu:', error);
        const container = document.getElementById('admin-menu-list');
        if (container) container.textContent = 'ไม่สามารถเชื่อมต่อ Server ได้';
    }
}

async function handleAddMenu(event) {
    event.preventDefault();

    const newProduct = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        type: document.getElementById('type').value,
        cat: document.getElementById('cat').value
    };

    try {
        const response = await fetch(`${API}/api/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            alert('เพิ่มเมนูสำเร็จ!');
            document.getElementById('add-menu-form').reset();
            loadAdminMenu();
        } else {
            const data = await response.json().catch(() => ({}));
            alert(data.message || 'ไม่สามารถเพิ่มเมนูได้');
        }
    } catch (error) {
        console.error('Error adding menu:', error);
        alert('ไม่สามารถเชื่อมต่อ Server ได้');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const session = await getSession();

        if (!session || !session.isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }

        // หน้านี้สำหรับ Admin เท่านั้น
        if (String(session.type).toLowerCase() !== 'admin') {
            alert('บัญชีนี้ไม่มีสิทธิ์จัดการสินค้า');
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('displayName').textContent = session.username || '-';
        applyTheme(session.theme || 'light');

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch(`${API}/api/users/logout`, {
                    method: 'POST',
                    credentials: 'include'
                }).catch(() => {});
                localStorage.removeItem('cart');
                window.location.href = 'login.html';
            });
        }

        document.getElementById('add-menu-form')?.addEventListener('submit', handleAddMenu);
        loadAdminMenu();
    } catch (error) {
        console.error('Admin session check failed:', error);
        window.location.href = 'login.html';
    }
});
