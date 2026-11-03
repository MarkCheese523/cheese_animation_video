/* Shared vocabulary for element research, selection and motion composition. */
const ELEMENT_STATES = Object.freeze({
  button: { label: '按钮', states: ['idle', 'hover', 'press', 'loading', 'success'], presets: ['press', 'morph', 'drawOn'] },
  card: { label: '卡片', states: ['enter', 'selected', 'reflow', 'exit'], presets: ['springEnter', 'reflow', 'maskReveal'] },
  icon: { label: '图标', states: ['draw', 'morph', 'swap', 'settle'], presets: ['drawOn', 'morph', 'logoResolve'] },
  cursor: { label: '光标', states: ['move', 'hover', 'click', 'drag'], presets: ['reflow', 'press'] },
  connector: { label: '连接器', states: ['flow', 'blocked', 'broken', 'restored'], presets: ['drawOn', 'stateFlip'] },
  metric: { label: '数字／标签', states: ['reveal', 'roll', 'emphasize', 'settle'], presets: ['maskReveal', 'counterRoll', 'springEnter'] }
});

const MOTION_CATALOG = Object.freeze([
  { id: 'maskReveal', label: '遮罩揭示', role: '出现' },
  { id: 'drawOn', label: '路径绘制', role: '出现' },
  { id: 'morph', label: '形状变形', role: '结构' },
  { id: 'reflow', label: '布局重排', role: '结构' },
  { id: 'press', label: '按压回弹', role: '反馈' },
  { id: 'counterRoll', label: '数字滚动', role: '数据' },
  { id: 'stateFlip', label: '状态切换', role: '状态' },
  { id: 'logoResolve', label: '聚合收束', role: '收束' }
]);
