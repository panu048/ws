const API_BASE = (window.location.port === '3000' || window.location.port === '') ? '' : 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const showPassword = document.getElementById('showPassword');
    const passwordInput = document.getElementById('password');

    // ตรวจสอบ Session จาก Server ก่อน
    // sid เป็น HttpOnly จึงอ่านด้วย document.cookie ไม่ได้
    try {
        const check = await fetch(`${API_BASE}/api/users/info`, {
            method: 'GET',
            credentials: 'include'
        });

        const session = await check.json();
        if (session.isLoggedIn) {
            window.location.href = 'index.html';
            return;
        }
    } catch (err) {
        console.warn('ตรวจสอบ Session ไม่สำเร็จ:', err);
    }

    if (showPassword && passwordInput) {
        showPassword.addEventListener('change', () => {
            passwordInput.type = showPassword.checked ? 'text' : 'password';
        });
    }

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = passwordInput.value;
        const theme = document.getElementById('themeSelect').value;

        if (!username || !password) {
            alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        if (password.length < 4) {
            alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password, theme })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // ให้ Browser บันทึก sid Cookie ก่อนเปลี่ยนหน้า
                window.location.replace('index.html');
            } else {
                alert(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        } catch (err) {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    });
});
