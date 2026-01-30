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
      description,
      assetTag,
      serialNumber,
      purchaseOrderNumber,
      invoiceNumber,
      serviceProvider,
      brand,
      cost,
      purchaseDate,
      condition,
      depreciationRate,
      assetLife,
      residualValue,
      entity_model,
      warrantyPeriod,
      warrantyExpiration,
      category_id,
      department_id,
      site_id,
      location_id,
      assetStatus_id,
      isDepreciable,
      depreciationMethod_id,
      licenseType,
      supplier,
      licenseKey,
      numberOfSeats,
      renewalDate,
      supportContact,
      vehicle_make_id,
      vin,
      licensePlate,
      servicePlanPeriod,
      dueForService,
      servicePlanExpiration,
      discExpiration,
      lastMaintenanceDate
    } = body;

    // Validate required fields
    if (!description || !assetTag || !category_id || !department_id || !assetStatus_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get category name
    const category = db.prepare('SELECT name FROM asset_categories WHERE id = ?').get(category_id) as { name: string } | undefined;
    const department = db.prepare('SELECT name FROM core_departments WHERE id = ?').get(department_id) as { name: string } | undefined;
    const assetStatus = db.prepare('SELECT name FROM asset_statuses WHERE id = ?').get(assetStatus_id) as { name: string } | undefined;
    const site = site_id ? db.prepare('SELECT name FROM core_sites WHERE id = ?').get(site_id) as { name: string } | undefined : null;
    const location = location_id ? db.prepare('SELECT name FROM core_locations WHERE id = ?').get(location_id) as { name: string } | undefined : null;
    const depreciationMethod = depreciationMethod_id ? db.prepare('SELECT name FROM asset_depreciation_methods WHERE id = ?').get(depreciationMethod_id) as { name: string } | undefined : null;
    const vehicleMake = vehicle_make_id ? db.prepare('SELECT name FROM asset_vehicle_makes WHERE id = ?').get(vehicle_make_id) as { name: string } | undefined : null;

    // Insert the new asset
    const result = db.prepare(`
      INSERT INTO assets (
        tenant_id, description, assetTag, serialNumber, purchaseOrderNumber, invoiceNumber,
        serviceProvider, brand, cost, purchaseDate, condition, depreciationRate, assetLife,
        residualValue, entity_model, warrantyPeriod, warrantyExpiration, category_id, category_name,
        department_id, department_name, site_id, site_name, location_id, location_name,
        assetStatus_id, assetStatus_name, isDepreciable, depreciationMethod_id, depreciationMethod_name,
        licenseType, supplier, licenseKey, numberOfSeats, renewalDate, supportContact,
        vehicle_make_id, vehicle_make_name, vin, licensePlate, servicePlanPeriod, dueForService,
        servicePlanExpiration, discExpiration, lastMaintenanceDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.tenant_id,
      description,
      assetTag,
      serialNumber || null,
      purchaseOrderNumber || null,
      invoiceNumber || null,
      serviceProvider || null,
      brand || null,
      cost || null,
      purchaseDate || null,
      condition || null,
      depreciationRate || null,
      assetLife || null,
      residualValue || null,
      entity_model || null,
      warrantyPeriod || null,
      warrantyExpiration || null,
      category_id,
      category?.name || null,
      department_id,
      department?.name || null,
      site_id || null,
      site?.name || null,
      location_id || null,
      location?.name || null,
      assetStatus_id,
      assetStatus?.name || null,
      isDepreciable ? 1 : 0,
      depreciationMethod_id || null,
      depreciationMethod?.name || null,
      licenseType || null,
      supplier || null,
      licenseKey || null,
      numberOfSeats || null,
      renewalDate || null,
      supportContact || null,
      vehicle_make_id || null,
      vehicleMake?.name || null,
      vin || null,
      licensePlate || null,
      servicePlanPeriod || null,
      dueForService || null,
      servicePlanExpiration || null,
      discExpiration || null,
      lastMaintenanceDate || null
    );

    return NextResponse.json({
      success: true,
      asset_id: result.lastInsertRowid,
      asset_tag: assetTag
    }, { status: 201 });

  } catch (error) {
    console.error('Create asset error:', error);
    return NextResponse.json(
      { error: 'Failed to create asset' },
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
    
    // Get all assets with related data
    const assets = db.prepare(`
      SELECT * FROM assets
      WHERE tenant_id = ?
      ORDER BY purchaseDate DESC, id DESC
    `).all(user.tenant_id);

    // Get asset statistics
    const stats = {
      total: assets.length,
      active: assets.filter((a: any) => a.assetStatus_id === 1).length,
      inRepair: assets.filter((a: any) => a.assetStatus_id === 2).length,
      retired: assets.filter((a: any) => a.assetStatus_id === 3).length,
      totalValue: assets.reduce((sum: number, a: any) => sum + (a.cost || 0), 0),
    };

    // Get assets by category
    const assetsByCategory = db.prepare(`
      SELECT 
        ac.id,
        ac.name,
        COUNT(a.id) as asset_count,
        SUM(a.cost) as total_value
      FROM asset_categories ac
      LEFT JOIN assets a ON ac.id = a.category_id AND a.tenant_id = ?
      WHERE ac.tenant_id = ?
      GROUP BY ac.id, ac.name
      ORDER BY asset_count DESC
    `).all(user.tenant_id, user.tenant_id);

    // Get assets by status
    const assetsByStatus = db.prepare(`
      SELECT 
        ast.name as status_name,
        ast.color,
        COUNT(a.id) as count
      FROM asset_statuses ast
      LEFT JOIN assets a ON ast.id = a.assetStatus_id AND a.tenant_id = ?
      GROUP BY ast.id, ast.name, ast.color
    `).all(user.tenant_id);

    return NextResponse.json({
      assets,
      stats,
      assetsByCategory,
      assetsByStatus
    });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
