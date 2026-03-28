// src/App.jsx
import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('alumni');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('api_url'));
  
  // 新增数据的全局弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (apiUrl && !showConfig) {
      fetchData(activeTab);
    }
  }, [activeTab, apiUrl, showConfig]);

  const fetchData = async (type) => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      const formattedUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const res = await fetch(`${formattedUrl}/api/${type}`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data);
      } else {
        alert("获取数据失败: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("网络请求错误，请检查 API 地址是否正确，且 Cloudflare 上是否存在跨域屏蔽。");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const url = fd.get('apiUrl');
    if (url) {
      localStorage.setItem('api_url', url);
      setApiUrl(url);
      setShowConfig(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.target);
    const payload = Object.fromEntries(fd.entries());
    
    try {
      const formattedUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const res = await fetch(`${formattedUrl}/api/${activeTab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowModal(false);
        fetchData(activeTab); // 提交成功后立刻重新拉取最新数据刷屏
      } else {
        alert("提交失败，如果报错 UNIQUE 意味着系统里已有该重名的记录了: " + json.message);
      }
    } catch (err) {
      alert("提交报错: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🏫</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>西南交大校友会</div>
        </div>

        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'alumni' && !showConfig ? 'active' : ''}`}
            onClick={() => {setActiveTab('alumni'); setShowConfig(false)}}
          >
            👥 校友管理
          </div>
          <div 
            className={`nav-item ${activeTab === 'events' && !showConfig ? 'active' : ''}`}
            onClick={() => {setActiveTab('events'); setShowConfig(false)}}
          >
            📅 活动大盘
          </div>
          <div 
            className={`nav-item ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(true)}
            style={{ marginTop: 'auto' }}
          >
            ⚙️ 后端网络设置
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content relative">
        {showConfig ? (
          <div className="card config-card" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10%' }}>
            <h2>连接到云端数据库 (Cloudflare)</h2>
            <p className="caption" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
              为了保障您的数据隔离安全，独立的后台端需要先关联您的 Cloudflare 线上接口地址。<br/>
              请输入您刚刚部署成功的 Workers 对外链接（类似于 <strong>https://sjtuaa-backend...</strong>）。
            </p>
            <form onSubmit={handleConfigSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                name="apiUrl"
                type="url" 
                defaultValue={apiUrl}
                required
                placeholder="https://xiaoyouhui.chuanwenjian.com"
                style={{ padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', outline: 'none' }}
              />
              <button type="submit" className="btn" style={{ justifyContent: 'center' }}>🚀 连接数据库</button>
            </form>
          </div>
        ) : (
          <>
            <div className="header-actions">
              <div>
                <h1>{activeTab === 'alumni' ? '校友会员数据库' : '全年活动排期计划'}</h1>
                <p className="caption">
                  {activeTab === 'alumni' ? '集中管理每一位实名校友的专业履历以及届别标识。' : '高层次统筹校友会各地的线上/线下交流会议。'}
                </p>
              </div>
              <button className="btn shadow-md" style={{ transform: 'none' }} onClick={() => setShowModal(true)}>
                + 新增{activeTab === 'alumni' ? '校友' : '活动'}
              </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div className="loader-wrapper">
                   正在极速越洋穿梭，请求您的 Cloudflare D1 边缘节点真实数据... 🌐
                </div>
              ) : (
                <table className="table-container">
                  <thead style={{ background: '#f8fafc' }}>
                    {activeTab === 'alumni' ? (
                      <tr>
                        <th>ID</th>
                        <th>姓名</th>
                        <th>届别</th>
                        <th>大学专业</th>
                        <th>系统录入时间</th>
                      </tr>
                    ) : (
                      <tr>
                        <th>ID</th>
                        <th>活动标题</th>
                        <th>举办地点</th>
                        <th>活动简介与纪要</th>
                        <th>系统录入时间</th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          太干净了，数据库里目前并没有抓取到数据。
                        </td>
                      </tr>
                    ) : data.map(item => (
                      <tr key={item.id} className="table-row">
                        {activeTab === 'alumni' ? (
                          <>
                            <td className="caption">#{item.id}</td>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td><span className="badge badge-blue">{item.batch}</span></td>
                            <td>{item.major || '-'}</td>
                            <td className="caption">{new Date(item.created_at).toLocaleDateString()}</td>
                          </>
                        ) : (
                          <>
                            <td className="caption">#{item.id}</td>
                            <td style={{ fontWeight: 600 }}>{item.title}</td>
                            <td><span className="badge badge-green">{item.location}</span></td>
                            <td className="caption" style={{maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                              {item.content || '-'}
                            </td>
                            <td className="caption">{new Date(item.created_at).toLocaleDateString()}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 新增数据时的漂浮弹窗 Modal Overlay */}
            {showModal && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h2 style={{ marginBottom: '1.5rem' }}>新增{activeTab === 'alumni' ? '实名校友' : '校友活动'}</h2>
                  <form onSubmit={handleSubmit}>
                    {activeTab === 'alumni' ? (
                      <>
                        <div className="form-group">
                          <label className="form-label">校友真实姓名 *</label>
                          <input type="text" name="name" required className="input-field" placeholder="例如：李白" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">毕业届别 *</label>
                          <input type="text" name="batch" required className="input-field" placeholder="例如：2018届" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">大学就读专业</label>
                          <input type="text" name="major" className="input-field" placeholder="例如：车辆工程" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">活动官方标题 *</label>
                          <input type="text" name="title" required className="input-field" placeholder="例如：2026校友迎新大会" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">举办详细地点 *</label>
                          <input type="text" name="location" required className="input-field" placeholder="例如：九里校区国际会议厅" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">活动大纲/会议记录</label>
                          <textarea name="content" className="input-field" style={{ minHeight: '100px', resize: 'vertical' }} placeholder="在这里随时发布活动预告或者会后的所有会议核心纪实..."></textarea>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                      <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-color)', color: 'var(--text-main)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>取消</button>
                      <button type="submit" className="btn" style={{ flex: 2, justifyContent: 'center' }} disabled={submitting}>
                        {submitting ? '跨洋录入中...' : '提交入库并通告全员'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
