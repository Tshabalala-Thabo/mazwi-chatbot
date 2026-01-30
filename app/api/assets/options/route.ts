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
    
    // Get all dropdown options for the asset form
    const categories = db.prepare('SELECT id, name FROM asset_categories WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const statuses = db.prepare('SELECT id, name, color FROM asset_statuses ORDER BY name').all();
    const depreciationMethods = db.prepare('SELECT id, name FROM asset_depreciation_methods ORDER BY name').all();
    const departments = db.prepare('SELECT id, name FROM core_departments WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const sites = db.prepare('SELECT id, name FROM core_sites WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const locations = db.prepare('SELECT id, name, site_id FROM core_locations WHERE tenant_id = ? ORDER BY name').all(user.tenant_id);
    const vehicleMakes = db.prepare('SELECT id, name FROM asset_vehicle_makes ORDER BY name').all();

    return NextResponse.json({
      categories,
      statuses,
      depreciationMethods,
      departments,
      sites,
      locations,
      vehicleMakes
    });
  } catch (error) {
    console.error('Asset options API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
