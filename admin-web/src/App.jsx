// src/App.jsx
import React, { useState, useEffect } from 'react';
import '@wangeditor/editor/dist/css/style.css'; // 引入 css
import { Editor, Toolbar } from '@wangeditor/editor-for-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('alumni'); // alumni | events | records
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('api_url') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('api_url'));
  
  // 新增/编辑模态框全局状态
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // 为 null 则是新增，否则是编辑操作

  // WangEditor 专属状态管理
  const [editor, setEditor] = useState(null); // 存储 editor 实例
  const [htmlContent, setHtmlContent] = useState(''); // 绑定富文本 HTML
  const [recordTitle, setRecordTitle] = useState("");

  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 从后端边缘节点拉取真数据
  useEffect(() => {
    if (apiUrl && !showConfig) {
      fetchData(activeTab);
    }
  }, [activeTab, apiUrl, showConfig]);

  const getBaseUrl = () => apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  const fetchData = async (type) => {
    if (!apiUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`${getBaseUrl()}/api/${type}`);
      const json = await res.json();
      if (json.status === 'success') {
        setData(json.data);
      } else {
        alert("获取数据失败: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("网络请求错误，请检查 API 网址输入是否有误。");
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

  // ======================
  // 删改交互通用大厅
  // ======================
  const handleCreateClick = () => {
    setEditingItem(null);
    if (activeTab === 'records') {
      setRecordTitle("");
      setHtmlContent("");
    }
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    if (activeTab === 'records') {
      setRecordTitle(item.title);
      setHtmlContent(item.html_content || '');
    }
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("❗ 危险操作：确认永久删除这条数据吗？删除后将无法在微信侧恢复！")) return;
    try {
      const res = await fetch(`${getBaseUrl()}/api/${activeTab}?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 'success') {
        fetchData(activeTab); // 立刻重刷大屏数据
      } else {
        alert("删除失败: " + json.message);
      }
    } catch (err) {
      alert("删除时服务器崩溃或网络阻断");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    let payload = {};
    if (activeTab === 'records') {
       // 防御性拦截空白内容 (富文本空标签情况)
       if (!recordTitle || !htmlContent || htmlContent === '<p><br></p>') { 
         alert("公众号标题和正文均不可为空！"); setSubmitting(false); return; 
       }
       payload = { title: recordTitle, html_content: htmlContent };
    } else {
       const fd = new FormData(e.target);
       payload = Object.fromEntries(fd.entries());
    }

    try {
      const isEdit = !!editingItem;
      const url = isEdit ? `${getBaseUrl()}/api/${activeTab}?id=${editingItem.id}` : `${getBaseUrl()}/api/${activeTab}`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.status === 'success') {
        setShowModal(false);
        fetchData(activeTab); 
      } else {
        alert("提交入库被拒: " + json.message);
      }
    } catch (err) {
      alert("因网络等错误导致提交坠毁: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ======================
  // 王级 (WangEditor) 富文本引擎及极限压缩劫持底层
  // ======================
  const compressImage = (file, maxWidth = 1366, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          // 按比例将巨型原图收缩
          if (width > maxWidth) {
             height = Math.round(height * (maxWidth / width));
             width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // 抽出纯净压缩流，转换为节约几百倍空间的 jpg 格式
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
          }, "image/jpeg", quality);
        };
      };
    });
  };

  const toolbarConfig = { };
  const editorConfig = {
    placeholder: '欢迎来到国内顶级的 WangEditor 可视化专区！您可以像公众号一样尽情挥洒笔墨并插入完美原图。',
    MENU_CONF: {
      uploadImage: {
         // 自定义劫持上传核心逻辑：极速压缩 -> 对接 Cloudflare R2
         async customUpload(file, insertFn) {
            try {
               // 触发超强压缩：哪怕原图是 10MB 的单反大图，这里也会被秒缩到一百多 KB 左右。
               const compressedFile = await compressImage(file, 1280, 0.82);
               
               const res = await fetch(`${getBaseUrl()}/api/upload`, {
                 method: "POST",
                 headers: { "Content-Type": compressedFile.type },
                 body: compressedFile
               });
               const json = await res.json();
               
               if(json.status === 'success') {
                  const fullUrl = `${getBaseUrl()}${json.url}`;
                  // WangEditor 官方标准的跨洋注图动作
                  insertFn(fullUrl, '校友会纪实照片', fullUrl); 
               } else {
                  alert("R2 节点驳回存储请求: " + json.message);
               }
            } catch (err) {
               alert("跨洋传图在网络层崩塌或超时，请检查节点连通性！");
            }
         }
      }
    }
  };

  // 获取各种页面文字
  const getPageTitle = () => {
    if (activeTab === 'alumni') return '校友实名录大盘';
    if (activeTab === 'events') return '日历与集会排期';
    return '长篇会议记录档案 (高级架构)';
  };

  const getPageCaption = () => {
    if (activeTab === 'alumni') return '校改每一位实名校友的专业履历以及届别标识。';
    if (activeTab === 'events') return '高调统筹校友会各地的所有线上/线下预定交流事项。';
    return '配备国民级 WangEditor 重型引擎。所有的配图完美支持任意拐角拖拽，并通过底层极限压缩分发进云端 R2。';
  };

  return (
    <div className="layout">
      {/* Sidebar 独立导航模块 */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🏫</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>西南交大控制台</div>
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
            className={`nav-item ${activeTab === 'records' && !showConfig ? 'active' : ''}`}
            onClick={() => {setActiveTab('records'); setShowConfig(false)}}
          >
            📝 会议记录 (图文)
          </div>
          <div 
            className={`nav-item ${showConfig ? 'active' : ''}`}
            onClick={() => setShowConfig(true)}
            style={{ marginTop: 'auto' }}
          >
            ⚙️ 后端边缘核心设置
          </div>
        </nav>
      </aside>

      {/* 主屏幕 */}
      <main className="main-content relative">
        {showConfig ? (
          <div className="card config-card" style={{ maxWidth: '600px', margin: '0 auto', marginTop: '10%' }}>
            <h2>连接到云原生边缘网络 (Workers)</h2>
            <p className="caption" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
              为了保障您的数据隔离安全，控制台需要获取并校验您的唯一合法海外 Cloudflare 边缘节点入口地址。<br/>
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
              <button type="submit" className="btn" style={{ justifyContent: 'center' }}>🚀 连接底层数据库</button>
            </form>
          </div>
        ) : (
          <>
            <div className="header-actions">
              <div>
                <h1>{getPageTitle()}</h1>
                <p className="caption">{getPageCaption()}</p>
              </div>
              <button className="btn shadow-md" style={{ transform: 'none' }} onClick={handleCreateClick}>
                + 新增{activeTab === 'alumni' ? '录入' : activeTab === 'events' ? '活动' : '长篇记录'}
              </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div className="loader-wrapper">
                   穿过太平洋海底光缆查询中... 请稍待片刻 🌐
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-container">
                    <thead style={{ background: '#f8fafc' }}>
                      {activeTab === 'alumni' ? (
                        <tr>
                          <th>全局ID</th><th>真实姓名</th><th>届别</th><th>专业情况</th><th>注册日期</th><th style={{textAlign:'right'}}>操作指令</th>
                        </tr>
                      ) : activeTab === 'events' ? (
                        <tr>
                          <th>活动ID</th><th>官方大标</th><th>物理场地</th><th>事件速记</th><th>宣发日期</th><th style={{textAlign:'right'}}>操作指令</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>文章ID</th><th>封面新闻标题</th><th>图文引擎摘要</th><th>定稿日期</th><th style={{textAlign:'right'}}>操作指令</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {data.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            一片虚无，此分类暂无任何记录或已遭全部清空。
                          </td>
                        </tr>
                      ) : data.map(item => (
                        <tr key={item.id} className="table-row">
                          {/* 校友布局 */}
                          {activeTab === 'alumni' && (
                            <>
                              <td className="caption">#{item.id}</td>
                              <td style={{ fontWeight: 600 }}>{item.name}</td>
                              <td><span className="badge badge-blue">{item.batch}</span></td>
                              <td>{item.major || '-'}</td>
                              <td className="caption">{new Date(item.created_at).toLocaleDateString()}</td>
                            </>
                          )}
                          {/* 活动布局 */}
                          {activeTab === 'events' && (
                            <>
                              <td className="caption">#{item.id}</td>
                              <td style={{ fontWeight: 600 }}>{item.title}</td>
                              <td><span className="badge badge-green">{item.location}</span></td>
                              <td className="caption" style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {item.content || '-'}
                              </td>
                              <td className="caption">{new Date(item.created_at).toLocaleDateString()}</td>
                            </>
                          )}
                          {/* 会议记录排版 */}
                          {activeTab === 'records' && (
                            <>
                              <td className="caption">#{item.id}</td>
                              <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.title}</td>
                              <td className="caption" style={{maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {/* 清洗掉 HTML 的尖括号用于仅展示文字摘要 */}
                                {(item.html_content || "").replace(/<[^>]+>/g, '').substring(0, 40)}...
                              </td>
                              <td className="caption">{new Date(item.created_at).toLocaleDateString()}</td>
                            </>
                          )}
                          
                          {/* 编辑删除操作列通用 */}
                          <td style={{textAlign: 'right', whiteSpace: 'nowrap'}}>
                            <button className="action-btn" title="二次编辑" onClick={() => handleEditClick(item)}>✏️</button>
                            <button className="action-btn" title="彻底抹除" onClick={() => handleDeleteClick(item.id)} style={{ marginLeft: '10px' }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 顶配增删改查表单底层系统 */}
            {showModal && (
              <div className="modal-overlay" onClick={() => setShowModal(false)}>
                <div className="modal-content" style={{maxWidth: activeTab === 'records' ? '900px' : '480px'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-hover)' }}>
                    {editingItem ? '二次订错修改 ' : '全新下发指令 '}{activeTab === 'alumni' ? '实名制校友' : activeTab === 'events' ? '线下集会日历' : '长篇图文报告'}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    
                    {/* 校友表单 */}
                    {activeTab === 'alumni' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">校友核心署名 *</label>
                          <input type="text" name="name" defaultValue={editingItem?.name || ''} required className="input-field" placeholder="例如：李白" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">校级届别标识 *</label>
                          <input type="text" name="batch" defaultValue={editingItem?.batch || ''} required className="input-field" placeholder="例如：2018届" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">院系分流档案</label>
                          <input type="text" name="major" defaultValue={editingItem?.major || ''} className="input-field" placeholder="例如：力学工程" />
                        </div>
                      </>
                    )}

                    {/* 活动表单 */}
                    {activeTab === 'events' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">宣传预大标 *</label>
                          <input type="text" name="title" defaultValue={editingItem?.title || ''} required className="input-field" placeholder="例如：2026年终总结大典" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">物理导航定位点 *</label>
                          <input type="text" name="location" defaultValue={editingItem?.location || ''} required className="input-field" placeholder="例如：交大犀浦第一报告厅" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">高层流转速记（纯文本摘要）</label>
                          <textarea name="content" defaultValue={editingItem?.content || ''} className="input-field" style={{ minHeight: '120px', resize: 'vertical' }} placeholder="预留内部讨论或安排简要纪实..."></textarea>
                        </div>
                      </>
                    )}

                    {/* WangEditor 巨型重构模块 */}
                    {activeTab === 'records' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">对开长篇核心头条 *</label>
                          <input type="text" value={recordTitle} onChange={e => setRecordTitle(e.target.value)} required className="input-field" style={{fontSize: '1.2rem', fontWeight: 600}} placeholder="输入惊爆校友圈的热门长文章标题！" />
                        </div>
                        <div className="form-group" style={{ zIndex: 100 }}>
                          <label className="form-label">巨型企业级富媒体撰写处 (WangEditor X Cloudflare R2) *</label>
                          <div style={{ border: '1px solid #ccc', zIndex: 100, borderRadius: '8px', overflow: 'hidden' }}>
                            <Toolbar
                                editor={editor}
                                defaultConfig={toolbarConfig}
                                mode="default"
                                style={{ borderBottom: '1px solid #ccc' }}
                            />
                            <Editor
                                defaultConfig={editorConfig}
                                value={htmlContent}
                                onCreated={setEditor}
                                onChange={editor => setHtmlContent(editor.getHtml())}
                                mode="default"
                                style={{ height: '450px', overflowY: 'hidden' }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                      <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-color)', color: 'var(--text-main)', boxShadow: 'none' }} onClick={() => setShowModal(false)}>取消操作</button>
                      <button type="submit" className="btn" style={{ flex: 2, justifyContent: 'center' }} disabled={submitting}>
                        {submitting ? '顶级架构握手中...' : (editingItem ? '覆盖保存修改' : '发布进全球终端')}
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
