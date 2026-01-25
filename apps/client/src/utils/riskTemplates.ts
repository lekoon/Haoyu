import type { Risk, RiskCategory } from '../types';

/**
 * Risk Template for common project risks
 */
export interface RiskTemplate {
    id: string;
    name: string;
    category: RiskCategory;
    description: string;
    probability: number;
    impact: number;
    mitigationStrategy: string;
    contingencyPlan?: string;
    tags: string[];
    applicableProjectTypes?: string[]; // e.g., ['web', 'mobile', 'infrastructure']
}

/**
 * Built-in risk templates based on industry best practices
 */
export const RISK_TEMPLATES: RiskTemplate[] = [
    // Schedule Risks
    {
        id: 'tmpl-schedule-001',
        name: '关键里程碑延期',
        category: 'schedule',
        description: '由于需求变更、技术难题或资源不足，关键里程碑可能无法按时完成',
        probability: 3,
        impact: 4,
        mitigationStrategy: '建立严格的变更控制流程，提前识别技术风险，预留缓冲时间，定期评审进度',
        contingencyPlan: '启动快速通道审批流程，增加资源投入，调整后续里程碑计划',
        tags: ['进度', '里程碑', '延期'],
        applicableProjectTypes: ['web', 'mobile', 'infrastructure'],
    },
    {
        id: 'tmpl-schedule-002',
        name: '依赖项目延期',
        category: 'schedule',
        description: '外部依赖项目或第三方服务延期交付，影响本项目进度',
        probability: 3,
        impact: 3,
        mitigationStrategy: '提前与依赖方确认交付时间，建立定期沟通机制，准备备选方案',
        contingencyPlan: '启用备选供应商或临时解决方案，调整项目计划以适应延期',
        tags: ['依赖', '外部', '进度'],
    },

    // Cost Risks
    {
        id: 'tmpl-cost-001',
        name: '预算超支',
        category: 'cost',
        description: '由于范围蔓延、资源成本上涨或意外支出，项目预算可能超支',
        probability: 3,
        impact: 4,
        mitigationStrategy: '严格控制范围变更，建立成本监控机制，预留应急预算（10-15%），定期审查成本',
        contingencyPlan: '削减非核心功能，寻求额外预算批准，优化资源配置',
        tags: ['预算', '成本', '超支'],
        applicableProjectTypes: ['web', 'mobile', 'data', 'infrastructure'],
    },
    {
        id: 'tmpl-cost-002',
        name: '隐藏成本',
        category: 'cost',
        description: '未预见的许可费用、基础设施成本或维护成本',
        probability: 2,
        impact: 3,
        mitigationStrategy: '全面评估所有潜在成本，包括许可、基础设施、培训和维护，预留应急资金',
        contingencyPlan: '重新评估技术选型，寻找开源替代方案，申请额外预算',
        tags: ['隐藏成本', '许可', '基础设施'],
    },

    // Resource Risks
    {
        id: 'tmpl-resource-001',
        name: '关键人员离职',
        category: 'resource',
        description: '核心团队成员离职，导致知识流失和项目延期',
        probability: 2,
        impact: 5,
        mitigationStrategy: '建立知识共享机制，文档化关键流程，交叉培训团队成员，提供有竞争力的薪酬',
        contingencyPlan: '快速招聘替代人员，内部调配资源，外包关键任务',
        tags: ['人员', '离职', '知识流失'],
        applicableProjectTypes: ['web', 'mobile', 'data', 'infrastructure'],
    },
    {
        id: 'tmpl-resource-002',
        name: '资源技能不匹配',
        category: 'resource',
        description: '团队成员缺乏项目所需的关键技能或经验',
        probability: 3,
        impact: 3,
        mitigationStrategy: '提前进行技能评估，提供培训和指导，引入外部专家，调整任务分配',
        contingencyPlan: '外包专业任务，聘请顾问，延长学习曲线时间',
        tags: ['技能', '培训', '能力'],
    },
    {
        id: 'tmpl-resource-003',
        name: '资源冲突',
        category: 'resource',
        description: '关键资源被多个项目争夺，导致分配不足',
        probability: 4,
        impact: 3,
        mitigationStrategy: '建立资源优先级机制，提前预订资源，与其他项目协调，增加资源池',
        contingencyPlan: '调整项目优先级，延长时间线，临时招聘外部资源',
        tags: ['资源冲突', '优先级', '分配'],
    },

    // Technical Risks
    {
        id: 'tmpl-technical-001',
        name: '技术选型错误',
        category: 'technical',
        description: '选择的技术栈不适合项目需求，导致性能问题或开发困难',
        probability: 2,
        impact: 4,
        mitigationStrategy: '进行充分的技术调研和POC验证，咨询专家意见，评估长期维护性',
        contingencyPlan: '重新评估技术选型，进行技术迁移，寻求专家支持',
        tags: ['技术选型', '架构', '性能'],
        applicableProjectTypes: ['web', 'mobile', 'data'],
    },
    {
        id: 'tmpl-technical-002',
        name: '第三方API不稳定',
        category: 'technical',
        description: '依赖的第三方API服务不稳定或频繁变更',
        probability: 3,
        impact: 3,
        mitigationStrategy: '选择可靠的服务提供商，实现重试和降级机制，监控API健康状态，准备备选方案',
        contingencyPlan: '切换到备用服务商，实现本地缓存，开发替代功能',
        tags: ['API', '第三方', '稳定性'],
    },
    {
        id: 'tmpl-technical-003',
        name: '安全漏洞',
        category: 'technical',
        description: '系统存在安全漏洞，可能导致数据泄露或攻击',
        probability: 2,
        impact: 5,
        mitigationStrategy: '定期安全审计，遵循安全最佳实践，使用安全扫描工具，及时更新依赖',
        contingencyPlan: '立即修复漏洞，通知受影响用户，加强安全监控',
        tags: ['安全', '漏洞', '数据保护'],
        applicableProjectTypes: ['web', 'mobile', 'data'],
    },

    // External Risks
    {
        id: 'tmpl-external-001',
        name: '政策法规变更',
        category: 'external',
        description: '相关政策法规变更，要求项目调整合规性',
        probability: 2,
        impact: 4,
        mitigationStrategy: '持续关注政策动态，咨询法律顾问，设计灵活的架构以适应变化',
        contingencyPlan: '快速调整系统设计，寻求法律支持，申请延期',
        tags: ['政策', '合规', '法规'],
    },
    {
        id: 'tmpl-external-002',
        name: '市场需求变化',
        category: 'external',
        description: '市场需求快速变化，导致项目目标过时',
        probability: 3,
        impact: 3,
        mitigationStrategy: '采用敏捷开发方法，定期收集市场反馈，保持产品灵活性',
        contingencyPlan: '快速调整产品方向，重新评估优先级，削减过时功能',
        tags: ['市场', '需求', '变化'],
        applicableProjectTypes: ['web', 'mobile'],
    },

    // Quality Risks
    {
        id: 'tmpl-quality-001',
        name: '质量标准不达标',
        category: 'quality',
        description: '产品质量无法满足预定标准，导致返工或客户不满',
        probability: 3,
        impact: 4,
        mitigationStrategy: '建立清晰的质量标准，实施持续集成和自动化测试，定期代码审查',
        contingencyPlan: '增加测试资源，延长测试周期，降低部分非核心功能的质量要求',
        tags: ['质量', '测试', '标准'],
        applicableProjectTypes: ['web', 'mobile', 'data', 'infrastructure'],
    },
    {
        id: 'tmpl-quality-002',
        name: '技术债务累积',
        category: 'quality',
        description: '为了赶进度而积累大量技术债务，影响长期维护',
        probability: 4,
        impact: 3,
        mitigationStrategy: '平衡速度和质量，定期重构，预留技术债务偿还时间',
        contingencyPlan: '安排专门的重构迭代，增加维护预算，优先偿还高风险债务',
        tags: ['技术债务', '重构', '维护'],
    },

    // Scope Risks
    {
        id: 'tmpl-scope-001',
        name: '需求蔓延',
        category: 'scope',
        description: '项目范围不断扩大，导致进度延期和成本超支',
        probability: 4,
        impact: 4,
        mitigationStrategy: '建立严格的变更控制流程，明确项目边界，管理干系人期望，使用MoSCoW优先级',
        contingencyPlan: '冻结新需求，推迟非核心功能到下一版本，重新评估资源需求',
        tags: ['范围', '需求', '变更'],
        applicableProjectTypes: ['web', 'mobile', 'data', 'infrastructure'],
    },
    {
        id: 'tmpl-scope-002',
        name: '需求不明确',
        category: 'scope',
        description: '项目需求模糊或频繁变更，导致返工和混乱',
        probability: 3,
        impact: 4,
        mitigationStrategy: '投入足够时间进行需求分析，使用原型验证，建立需求基线，定期与干系人确认',
        contingencyPlan: '暂停开发进行需求澄清，采用敏捷方法逐步明确需求',
        tags: ['需求', '澄清', '变更'],
    },
];

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: RiskCategory): RiskTemplate[] => {
    return RISK_TEMPLATES.filter((t) => t.category === category);
};

/**
 * Get templates by project type
 */
export const getTemplatesByProjectType = (projectType: string): RiskTemplate[] => {
    return RISK_TEMPLATES.filter(
        (t) => !t.applicableProjectTypes || t.applicableProjectTypes.includes(projectType)
    );
};

/**
 * Search templates by keyword
 */
export const searchTemplates = (keyword: string): RiskTemplate[] => {
    const lowerKeyword = keyword.toLowerCase();
    return RISK_TEMPLATES.filter(
        (t) =>
            t.name.toLowerCase().includes(lowerKeyword) ||
            t.description.toLowerCase().includes(lowerKeyword) ||
            t.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))
    );
};

/**
 * Create risk from template
 */
export const createRiskFromTemplate = (
    template: RiskTemplate,
    projectId: string,
    owner: string
): Omit<Risk, 'id' | 'riskScore' | 'priority' | 'history' | 'identifiedDate'> => {
    return {
        projectId,
        category: template.category,
        title: template.name,
        description: template.description,
        probability: template.probability,
        impact: template.impact,
        owner,
        status: 'identified',
        mitigationStrategy: template.mitigationStrategy,
        mitigationActions: [],
        contingencyPlan: template.contingencyPlan,
        tags: template.tags,
    };
};
