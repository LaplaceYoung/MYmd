import { UserCircle, Shield, Info } from 'lucide-react'
import logoSrc from '@/assets/logo.svg'
import './AccountPanel.css'

/** 账户面板：显示用户信息和应用关于 */
export function AccountPanel() {
    return (
        <div className="account-panel">
            <h2 className="account-panel__title">账户</h2>

            <div className="account-panel__card">
                <div className="account-panel__avatar">
                    <UserCircle size={56} strokeWidth={1} color="var(--accent)" />
                </div>
                <div className="account-panel__info">
                    <div className="account-panel__name">本地用户</div>
                    <div className="account-panel__desc">MYmd 当前为本地模式，所有数据保存在此设备上。</div>
                </div>
            </div>

            <div className="account-panel__section">
                <h3 className="account-panel__section-title">
                    <Info size={16} />
                    产品信息
                </h3>
                <div className="account-panel__product">
                    <img src={logoSrc} alt="MYmd" className="account-panel__logo" />
                    <div>
                        <div className="account-panel__product-name">MYmd</div>
                        <div className="account-panel__product-sub">轻量级 Markdown 桌面端阅读与编辑器</div>
                        <div className="account-panel__product-ver">版本 1.0.0</div>
                    </div>
                </div>
            </div>

            <div className="account-panel__section">
                <h3 className="account-panel__section-title">
                    <Shield size={16} />
                    许可证
                </h3>
                <p className="account-panel__license-text">
                    本产品遵循 MIT 开源许可协议。
                </p>
            </div>
        </div>
    )
}
