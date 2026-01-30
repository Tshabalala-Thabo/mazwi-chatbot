import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      risk_type_id,
      department_id,
      owner_id,
      category_id,
      sub_category_id,
      origin_id,
      risk_age_id,
      impact_rating_id,
      likelihood_rating_id,
      priority_id,
      approach_id,
      monitoring_frequency_id,
      causes,
      consequences,
      identification_date
    } = body;

    // Validate required fields
    if (!title || !description || !risk_type_id || !department_id || !owner_id || 
        !category_id || !impact_rating_id || !likelihood_rating_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the risk type prefix for generating risk number
    const riskType = db.prepare('SELECT prefix FROM risk_types WHERE id = ?').get(risk_type_id) as { prefix: string } | undefined;
    
    // Get the count of risks for this tenant to generate unique number
    const riskCount = db.prepare('SELECT COUNT(*) as count FROM risks WHERE tenant_id = ?').get(user.tenant_id) as { count: number };
    const riskNumber = `${riskType?.prefix || 'R'}-${new Date().getFullYear()}-${String(riskCount.count + 1).padStart(3, '0')}`;

    // Get impact and likelihood values to calculate inherent score
    const impactRating = db.prepare('SELECT value FROM risk_impact_rating_levels WHERE id = ?').get(impact_rating_id) as { value: number } | undefined;
    const likelihoodRating = db.prepare('SELECT value FROM risk_likelihood_rating_levels WHERE id = ?').get(likelihood_rating_id) as { value: number } | undefined;
    
    const inherit_risk_score = (impactRating?.value || 1) * (likelihoodRating?.value || 1);
    const residual_score = inherit_risk_score; // Initially same as inherent

    // Insert the new risk
    const result = db.prepare(`
      INSERT INTO risks (
        tenant_id, title, description, risk_number, risk_type_id, department_id, 
        owner_id, category_id, sub_category_id, origin_id, risk_age_id, 
        impact_rating_id, likelihood_rating_id, inherit_risk_score, residual_score,
        priority_id, approach_id, monitoring_frequency_id, causes, consequences,
        identification_date, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).run(
      user.tenant_id,
      title,
      description,
      riskNumber,
      risk_type_id,
      department_id,
      owner_id,
      category_id,
      sub_category_id || null,
      origin_id || null,
      risk_age_id || null,
      impact_rating_id,
      likelihood_rating_id,
      inherit_risk_score,
      residual_score,
      priority_id || null,
      approach_id || null,
      monitoring_frequency_id || null,
      JSON.stringify(causes || []),
      JSON.stringify(consequences || []),
      identification_date || new Date().toISOString().split('T')[0]
    );

    return NextResponse.json({
      success: true,
      risk_id: result.lastInsertRowid,
      risk_number: riskNumber
    }, { status: 201 });

  } catch (error) {
    console.error('Create risk error:', error);
    return NextResponse.json(
      { error: 'Failed to create risk' },
      { status: 500 }
    );
  }
}

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
    
    // Get all risks with related data
    const risks = db.prepare(`
      SELECT 
        r.*,
        rc.name as category_name,
        rsc.name as sub_category_name,
        rt.name as type_name,
        rt.prefix as type_prefix,
        ra.name as age_name,
        ro.name as origin_name,
        rap.name as approach_name,
        ril.name as impact_level,
        ril.value as impact_value,
        ril.color as impact_color,
        rll.name as likelihood_level,
        rll.value as likelihood_value,
        rll.color as likelihood_color,
        ris.name as inherent_rating,
        ris.color as inherent_color,
        d.name as department_name,
        u.name as owner_name,
        u.email as owner_email,
        p.name as priority_name,
        p.color as priority_color
      FROM risks r
      LEFT JOIN risk_categories rc ON r.category_id = rc.id
      LEFT JOIN risk_sub_categories rsc ON r.sub_category_id = rsc.id
      LEFT JOIN risk_types rt ON r.risk_type_id = rt.id
      LEFT JOIN risk_ages ra ON r.risk_age_id = ra.id
      LEFT JOIN risk_origins ro ON r.origin_id = ro.id
      LEFT JOIN risk_approaches rap ON r.approach_id = rap.id
      LEFT JOIN risk_impact_rating_levels ril ON r.impact_rating_id = ril.id
      LEFT JOIN risk_likelihood_rating_levels rll ON r.likelihood_rating_id = rll.id
      LEFT JOIN risk_inherent_settings ris ON r.inherit_risk_score BETWEEN ris.min_score AND ris.max_score
      LEFT JOIN core_departments d ON r.department_id = d.id
      LEFT JOIN core_users u ON r.owner_id = u.id
      LEFT JOIN core_priority_levels p ON r.priority_id = p.id
      WHERE r.tenant_id = ? AND (r.is_archived = 0 OR r.is_archived = 0.0 OR r.is_archived IS NULL)
      ORDER BY r.inherit_risk_score DESC, r.updated_at DESC
    `).all(user.tenant_id);

    // Get risk statistics
    const stats = {
      total: risks.length,
      critical: risks.filter(r => r.inherit_risk_score >= 20).length,
      high: risks.filter(r => r.inherit_risk_score >= 13 && r.inherit_risk_score < 20).length,
      medium: risks.filter(r => r.inherit_risk_score >= 7 && r.inherit_risk_score < 13).length,
      low: risks.filter(r => r.inherit_risk_score < 7).length,
    };

    // Get risk categories with counts
    const categories = db.prepare(`
      SELECT 
        rc.id,
        rc.name,
        COUNT(r.id) as risk_count
      FROM risk_categories rc
      LEFT JOIN risks r ON rc.id = r.category_id AND r.tenant_id = ? AND (r.is_archived = 0 OR r.is_archived = 0.0 OR r.is_archived IS NULL)
      WHERE rc.tenant_id = ?
      GROUP BY rc.id, rc.name
      ORDER BY risk_count DESC
    `).all(user.tenant_id, user.tenant_id);

    // Get risk trends (by age)
    const risksByAge = db.prepare(`
      SELECT 
        ra.name as age_name,
        COUNT(r.id) as count
      FROM risk_ages ra
      LEFT JOIN risks r ON ra.id = r.risk_age_id AND r.tenant_id = ? AND (r.is_archived = 0 OR r.is_archived = 0.0 OR r.is_archived IS NULL)
      WHERE ra.tenant_id = ?
      GROUP BY ra.id, ra.name
    `).all(user.tenant_id, user.tenant_id);

    return NextResponse.json({
      risks,
      stats,
      categories,
      risksByAge
    });
  } catch (error) {
    console.error('Risks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
