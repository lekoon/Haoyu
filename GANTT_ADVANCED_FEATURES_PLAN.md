# 🚀 甘特图高级功能实施计划

## Phase 2: 交互增强与批量操作 (进行中)

### 1. 左侧调整开始日期
- [ ] 添加左侧 Resize Handle
- [ ] 实现左侧拖拽逻辑 (`resize-l`)
- [ ] 更新 `startDate`，保持 `endDate` 不变（工期改变）

### 2. 拖拽创建依赖关系
- [ ] 激活连接点的拖拽事件
- [ ] 绘制临时的拖拽连线 (SVG)
- [ ] 释放时判断目标并创建依赖
- [ ] 触发 `onDependencyAdd` 回调

### 3. 多选和批量操作
- [ ] 状态中添加 `selectedIds: Set<string>`
- [ ] 实现 Ctrl/Shift + 点击多选
- [ ] 实现框选 (Selection Box)
- [ ] 批量拖拽移动逻辑

### 4. 撤销/重做 (Undo/Redo)
- [ ] 创建 `useHistory` Hook
- [ ] 记录关键操作 (Move, Resize, Delete, Add)
- [ ] 提供 Undo/Redo 按钮和快捷键 (Ctrl+Z/Y)

### 5. 任务分组折叠
- [ ] 支持 `group_by` 属性
- [ ] 渲染分组头
- [ ] 实现折叠/展开逻辑

---

## Phase 3: 高级可视化与导出 (计划中)

### 1. 里程碑标记
- [ ] 识别 `type: 'milestone'` 的任务
- [ ] 渲染为菱形图标
- [ ] 在时间轴上特殊标记

### 2. 关键路径高亮
- [ ] 实现 CPM (Critical Path Method) 算法
- [ ] 计算浮动时间 (Slack)
- [ ] 高亮零浮动时间的任务和连线

### 3. 资源分配显示
- [ ] 简单的资源负载热力图行 (在底部)
- [ ] 悬停显示资源详情

### 4. 导出为图片/PDF
- [ ] 集成 `html2canvas`
- [ ] 导出 SVG 为图片

### 5. 协作光标 (模拟)
- [ ] 简单的协作光标 UI 组件
