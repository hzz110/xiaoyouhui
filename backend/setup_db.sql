-- 校友表
CREATE TABLE IF NOT EXISTS alumni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    batch TEXT NOT NULL,       -- 届别，如 '2015届'
    major TEXT,                -- 专业
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入校友示例数据
INSERT OR IGNORE INTO alumni (name, batch, major) VALUES 
('李白', '2015届', '计算机科学与技术'),
('杜甫', '2016届', '汉语言文学'),
('苏轼', '2008届', '土木工程'),
('李娜', '2020届', '金融学'),
('张伟', '2018届', '机械工程');

-- 活动通知表
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    content TEXT,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入活动示例数据
INSERT OR IGNORE INTO events (title, content, location) VALUES 
('2026春季校友座谈会', '讨论校友基金2026年度使用计划及校友导师计划。', '学校报告厅'),
('2025秋季校友聚会', '秋季线下校友联谊与企业参访。', '成都市高新区'),
('AI 时代下的校友创业分享', '邀请知名校友分享人工智能创业经验。', '线上腾讯会议');
