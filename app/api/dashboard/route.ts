import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    
    // Get dashboard statistics
    const stats = {
      totalRisks: db.prepare('SELECT COUNT(*) as count FROM risks WHERE tenant_id = ? AND (is_archived = 0 OR is_archived = 0.0 OR is_archived IS NULL)').get(user.tenant_id) as { count: number },
      totalAssets: db.prepare('SELECT COUNT(*) as count FROM assets WHERE tenant_id = ?').get(user.tenant_id) as { count: number },
      totalIncidents: db.prepare('SELECT COUNT(*) as count FROM incidents WHERE tenant_id = ?').get(user.tenant_id) as { count: number },
      activeAudits: db.prepare('SELECT COUNT(*) as count FROM audit_engagements WHERE tenant_id = ? AND status_id IN (1, 2)').get(user.tenant_id) as { count: number },
      compliancePackages: db.prepare('SELECT COUNT(*) as count FROM compliance_packages WHERE tenant_id = ?').get(user.tenant_id) as { count: number },
      activePolicies: db.prepare('SELECT COUNT(*) as count FROM governance_policies WHERE tenant_id = ? AND policy_status_id = 3').get(user.tenant_id) as { count: number }
    };

    // Get recent risks
    const recentRisks = db.prepare(`
      SELECT id, title, risk_number, inherit_risk_score, residual_score 
      FROM risks 
      WHERE tenant_id = ? AND (is_archived = 0 OR is_archived = 0.0 OR is_archived IS NULL)
      ORDER BY updated_at DESC 
      LIMIT 5
    `).all(user.tenant_id);

    // Get tenant info
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id);

    return NextResponse.json({
      stats: {
        totalRisks: stats.totalRisks.count,
        totalAssets: stats.totalAssets.count,
        totalIncidents: stats.totalIncidents.count,
        activeAudits: stats.activeAudits.count,
        compliancePackages: stats.compliancePackages.count,
        activePolicies: stats.activePolicies.count
      },
      recentRisks,
      tenant
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
