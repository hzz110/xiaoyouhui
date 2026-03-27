-- 校友表
CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    batch TEXT NOT NULL,       -- 届别，如 '2015届'
    major TEXT,                -- 专业
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活动通知表
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
