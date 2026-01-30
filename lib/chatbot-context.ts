import { getDb } from './db';

export interface TenantContext {
  tenantId: number;
  tenantName: string;
  userId: number;
  userName: string;
}

export function getTenantData(tenantId: number) {
  const db = getDb();
  
  try {
    // Get tenant info
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    
    // Get statistics across all modules
    const stats = {
      risks: {
        total: db.prepare('SELECT COUNT(*) as count FROM risks WHERE tenant_id = ? AND is_archived = 0').get(tenantId) as { count: number },
        critical: db.prepare('SELECT COUNT(*) as count FROM risks WHERE tenant_id = ? AND is_archived = 0 AND inherit_risk_score >= 20').get(tenantId) as { count: number },
        high: db.prepare('SELECT COUNT(*) as count FROM risks WHERE tenant_id = ? AND is_archived = 0 AND inherit_risk_score >= 13 AND inherit_risk_score < 20').get(tenantId) as { count: number },
      },
      assets: {
        total: db.prepare('SELECT COUNT(*) as count FROM assets WHERE tenant_id = ?').get(tenantId) as { count: number },
        active: db.prepare('SELECT COUNT(*) as count FROM assets WHERE tenant_id = ? AND assetStatus_id = 1').get(tenantId) as { count: number },
      },
      incidents: {
        total: db.prepare('SELECT COUNT(*) as count FROM incidents WHERE tenant_id = ?').get(tenantId) as { count: number },
        open: db.prepare('SELECT COUNT(*) as count FROM incidents WHERE tenant_id = ? AND status_id IN (1, 2)').get(tenantId) as { count: number },
      },
      audits: {
        total: db.prepare('SELECT COUNT(*) as count FROM audit_engagements WHERE tenant_id = ?').get(tenantId) as { count: number },
        active: db.prepare('SELECT COUNT(*) as count FROM audit_engagements WHERE tenant_id = ? AND status_id IN (1, 2)').get(tenantId) as { count: number },
      },
      compliance: {
        total: db.prepare('SELECT COUNT(*) as count FROM compliance_packages WHERE tenant_id = ?').get(tenantId) as { count: number },
        compliant: db.prepare('SELECT COUNT(*) as count FROM compliance_packages WHERE tenant_id = ? AND compliance_package_status_id = 3').get(tenantId) as { count: number },
      },
      governance: {
        policies: db.prepare('SELECT COUNT(*) as count FROM governance_policies WHERE tenant_id = ?').get(tenantId) as { count: number },
        activePolicies: db.prepare('SELECT COUNT(*) as count FROM governance_policies WHERE tenant_id = ? AND policy_status_id = 3').get(tenantId) as { count: number },
      }
    };
    
    return {
      tenant,
      stats
    };
  } catch (error) {
    console.error('Error fetching tenant data:', error);
    return null;
  }
}

export function queryTenantData(tenantId: number, query: string) {
  const db = getDb();
  
  try {
    // Determine what data to fetch based on query keywords
    const queryLower = query.toLowerCase();
    const results: any = {};
    
    // Risk-related queries
    if (queryLower.includes('risk')) {
      results.risks = db.prepare(`
        SELECT id, title, risk_number, inherit_risk_score, residual_score, 
               identification_date, updated_at
        FROM risks 
        WHERE tenant_id = ? AND is_archived = 0 
        ORDER BY inherit_risk_score DESC 
        LIMIT 10
      `).all(tenantId);
      
      results.riskCategories = db.prepare('SELECT * FROM risk_categories WHERE tenant_id = ?').all(tenantId);
    }
    
    // Asset-related queries
    if (queryLower.includes('asset')) {
      results.assets = db.prepare(`
        SELECT id, description, assetTag, brand, cost, purchaseDate, 
               category_name, department_name, assetStatus_name
        FROM assets 
        WHERE tenant_id = ? 
        ORDER BY cost DESC 
        LIMIT 10
      `).all(tenantId);
    }
    
    // Incident-related queries
    if (queryLower.includes('incident')) {
      results.incidents = db.prepare(`
        SELECT id, title, description, date_occurred, severity_level_id, 
               status_id, created_at
        FROM incidents 
        WHERE tenant_id = ? 
        ORDER BY date_occurred DESC 
        LIMIT 10
      `).all(tenantId);
    }
    
    // Audit-related queries
    if (queryLower.includes('audit')) {
      results.audits = db.prepare(`
        SELECT id, engagement_id, title, start_date, end_date, 
               status_id, created_at
        FROM audit_engagements 
        WHERE tenant_id = ? 
        ORDER BY start_date DESC 
        LIMIT 10
      `).all(tenantId);
    }
    
    // Compliance-related queries
    if (queryLower.includes('compliance') || queryLower.includes('popia') || queryLower.includes('regulation')) {
      results.compliancePackages = db.prepare(`
        SELECT id, name, version, compliance_score, total_requirements, 
               completed_requirements, overdue_requirements
        FROM compliance_packages 
        WHERE tenant_id = ? 
        ORDER BY compliance_score ASC 
        LIMIT 10
      `).all(tenantId);
    }
    
    // Policy-related queries
    if (queryLower.includes('policy') || queryLower.includes('governance')) {
      results.policies = db.prepare(`
        SELECT id, title, version, effective_date, next_review_date, 
               policy_status_id
        FROM governance_policies 
        WHERE tenant_id = ? 
        ORDER BY next_review_date ASC 
        LIMIT 10
      `).all(tenantId);
    }
    
    // Department queries
    if (queryLower.includes('department')) {
      results.departments = db.prepare('SELECT * FROM departments WHERE tenant_id = ?').all(tenantId);
    }
    
    // User queries
    if (queryLower.includes('user') || queryLower.includes('staff') || queryLower.includes('employee')) {
      results.users = db.prepare('SELECT id, name, email FROM users WHERE tenant_id = ?').all(tenantId);
    }
    
    return results;
  } catch (error) {
    console.error('Error querying tenant data:', error);
    return null;
  }
}

export function buildSystemPrompt(context: TenantContext, tenantData: any): string {
  return `You are Mazwi, an AI assistant for the ProSuite GRC (Governance, Risk & Compliance) platform. You are helping ${context.userName} from ${context.tenantName}.

CURRENT ORGANIZATION DATA:
- Organization: ${context.tenantName}
- Total Risks: ${tenantData.stats.risks.total.count} (Critical: ${tenantData.stats.risks.critical.count}, High: ${tenantData.stats.risks.high.count})
- Total Assets: ${tenantData.stats.assets.total.count} (Active: ${tenantData.stats.assets.active.count})
- Total Incidents: ${tenantData.stats.incidents.total.count} (Open: ${tenantData.stats.incidents.open.count})
- Active Audits: ${tenantData.stats.audits.active.count} of ${tenantData.stats.audits.total.count}
- Compliance Packages: ${tenantData.stats.compliance.total.count} (Compliant: ${tenantData.stats.compliance.compliant.count})
- Active Policies: ${tenantData.stats.governance.activePolicies.count} of ${tenantData.stats.governance.policies.count}

YOUR CAPABILITIES:
- Answer questions about risks, assets, incidents, audits, compliance, and governance
- Provide insights and analysis based on the organization's GRC data
- Help users understand their compliance status, risk exposure, and audit findings
- Suggest actions based on the data
- Explain GRC concepts and best practices

IMPORTANT:
- Only provide information about ${context.tenantName}'s data
- Be concise and professional
- If you need specific data to answer a question, it will be provided in the context
- Always cite specific numbers and data points when available
- Suggest actionable next steps when appropriate`;
}
