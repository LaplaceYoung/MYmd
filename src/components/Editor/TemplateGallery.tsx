import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useEditorStore } from '@/stores/editorStore'
import { useI18n } from '@/i18n'
import './TemplateGallery.css'

interface TemplateItem {
    id: string
    title: string
    iconColor: string
    content: string
}

function buildTemplates(t: (key: string, values?: Record<string, string | number>) => string): TemplateItem[] {
    return [
        {
            id: 'blank',
            title: t('template.blank'),
            iconColor: 'var(--text-muted)',
            content: '',
        },
        {
            id: 'welcome',
            title: t('template.welcome'),
            iconColor: 'var(--accent)',
            content: t('template.welcomeContent'),
        },
        {
            id: 'tech_spec',
            title: t('template.techSpec'),
            iconColor: '#e74c3c',
            content: '# Technical Spec\n\n## Context\n\n- Problem\n- Constraints\n- Goal\n\n## Architecture\n\nDescribe the solution, modules, interfaces, and rollout plan.\n',
        },
        {
            id: 'invoice',
            title: t('template.invoice'),
            iconColor: '#f39c12',
            content: '# Expense Report\n\n## Submitter\n\n- Team\n- Name\n- Date\n\n## Items\n\n| Item | Amount | Note |\n| --- | ---: | --- |\n| Example | 0.00 | Add details |\n',
        },
        {
            id: 'meeting_notes',
            title: t('template.meetingNotes'),
            iconColor: '#27ae60',
            content: '# Meeting Notes\n\n## Agenda\n\n1. Topic one\n2. Topic two\n\n## Discussion\n\n- Key decisions\n- Risks\n- Follow-ups\n',
        },
        {
            id: 'academic_paper',
            title: t('template.academicPaper'),
            iconColor: '#8e44ad',
            content: '# Academic Draft\n\n## Abstract\n\nWrite the core summary here.\n\n## Method\n\nDescribe the problem setting, method, and equations.\n\n## Results\n\nSummarize your findings and analysis.\n',
        },
    ]
}

export function TemplateGallery() {
    const { t } = useI18n()
    const addTab = useEditorStore(s => s.addTab)
    const templates = useMemo(() => buildTemplates(t), [t])

    const handleNewDocument = (template: TemplateItem) => {
        addTab(null, template.content)
    }

    return (
        <div className="template-gallery">
            <h2 className="template-gallery__title">{t('template.title')}</h2>
            <div className="template-gallery__grid">
                {templates.map(template => (
                    <button
                        type="button"
                        key={template.id}
                        className="template-card"
                        aria-label={`Template: ${template.title}`}
                        onClick={() => handleNewDocument(template)}
                    >
                        <div className="template-card__preview">
                            <div className="template-card__paper">
                                {template.id === 'blank' ? (
                                    <div className="template-card__blank-icon">
                                        <FileText size={32} color={template.iconColor} strokeWidth={1} />
                                    </div>
                                ) : (
                                    <div className="template-card__mock-lines">
                                        <div className="mock-title" style={{ backgroundColor: template.iconColor }}></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line short"></div>
                                        <div className="mock-space"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line"></div>
                                        <div className="mock-line short"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="template-card__info">
                            <span className="template-card__name">{template.title}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
