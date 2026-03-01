import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import './styles/editor.css'
import './styles/color-schemes.css'

// 不使用 StrictMode：Milkdown/ProseMirror 编辑器在 StrictMode 的双重挂载下会产生重复实例
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
