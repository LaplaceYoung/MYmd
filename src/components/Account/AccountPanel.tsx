import { UserCircle, Shield, Info } from 'lucide-react'
import { useI18n } from '@/i18n'
import logoSrc from '@/assets/logo.svg'
import './AccountPanel.css'

export function AccountPanel() {
    const { t } = useI18n()

    return (
        <div className="account-panel">
            <h2 className="account-panel__title">{t('account.title')}</h2>

            <div className="account-panel__card">
                <div className="account-panel__avatar">
                    <UserCircle size={56} strokeWidth={1} color="var(--accent)" />
                </div>
                <div className="account-panel__info">
                    <div className="account-panel__name">{t('account.localUser')}</div>
                    <div className="account-panel__desc">{t('account.localDesc')}</div>
                </div>
            </div>

            <div className="account-panel__section">
                <h3 className="account-panel__section-title">
                    <Info size={16} />
                    {t('account.productInfo')}
                </h3>
                <div className="account-panel__product">
                    <img src={logoSrc} alt="MYmd" className="account-panel__logo" />
                    <div>
                        <div className="account-panel__product-name">MYmd</div>
                        <div className="account-panel__product-sub">{t('account.productSub')}</div>
                        <div className="account-panel__product-ver">Version 1.0.0</div>
                    </div>
                </div>
            </div>

            <div className="account-panel__section">
                <h3 className="account-panel__section-title">
                    <Shield size={16} />
                    {t('account.license')}
                </h3>
                <p className="account-panel__license-text">{t('account.licenseText')}</p>
            </div>
        </div>
    )
}

