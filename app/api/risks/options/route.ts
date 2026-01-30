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
    
    // Get all dropdown options for the risk form
    const categories = db.prepare('SELECT id, name FROM risk_categories WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const subCategories = db.prepare('SELECT id, name, category_id FROM risk_sub_categories WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const types = db.prepare('SELECT id, name, prefix FROM risk_types WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const ages = db.prepare('SELECT id, name FROM risk_ages WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const origins = db.prepare('SELECT id, name FROM risk_origins WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const approaches = db.prepare('SELECT id, name FROM risk_approaches WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const impactLevels = db.prepare('SELECT id, name, value, color FROM risk_impact_rating_levels WHERE tenant_id = ? ORDER BY value').all(user.tenant_id);
    const likelihoodLevels = db.prepare('SELECT id, name, value, color FROM risk_likelihood_rating_levels WHERE tenant_id = ? ORDER BY value').all(user.tenant_id);
    const priorities = db.prepare('SELECT id, name, level, color FROM core_priority_levels WHERE tenant_id = ? ORDER BY level').all(user.tenant_id);
    const departments = db.prepare('SELECT id, name FROM core_departments WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const users = db.prepare('SELECT id, name, email FROM core_users WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const monitoringFrequencies = db.prepare('SELECT id, name, days FROM risk_monitoring_frequencies WHERE tenant_id = ? ORDER BY days').all(user.tenant_id);

    return NextResponse.json({
      categories,
      subCategories,
      types,
      ages,
      origins,
      approaches,
      impactLevels,
      likelihoodLevels,
      priorities,
      departments,
      users,
      monitoringFrequencies
    });
  } catch (error) {
    console.error('Risk options API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
