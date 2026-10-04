const SESSION_COOKIE = 'sid';

function getSession(req) {
    const sessionId = req.cookies[SESSION_COOKIE];
    if (!sessionId) return null;

    const session = req.app.locals.sessions.get(sessionId);
    if (!session) return null;

    if (session.expiresAt <= Date.now()) {
        req.app.locals.sessions.delete(sessionId);
        return null;
    }

    // ต่ออายุ session เมื่อมีการใช้งาน
    session.expiresAt = Date.now() + req.app.locals.sessionMaxAge;
    return session;
}

function requireSession(req, res, next) {
    const session = getSession(req);

    if (!session) {
        res.clearCookie(SESSION_COOKIE, { path: '/' });
        return res.status(401).json({
            success: false,
            message: 'กรุณาเข้าสู่ระบบก่อน'
        });
    }

    req.session = session;
    next();
}

function requireAdmin(req, res, next) {
    // ต้องผ่าน requireSession มาก่อน
    if (!req.session) {
        return res.status(401).json({
            success: false,
            message: 'กรุณาเข้าสู่ระบบก่อน'
        });
    }

    if (String(req.session.type).toLowerCase() !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'ไม่มีสิทธิ์จัดการสินค้า'
        });
    }

    next();
}

module.exports = {
    SESSION_COOKIE,
    getSession,
    requireSession,
    requireAdmin
};