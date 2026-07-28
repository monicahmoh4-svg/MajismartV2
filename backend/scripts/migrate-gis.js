const db = require('../db');

async function runGISMigrations() {
  console.log('🗺️ Running GIS production migrations for all 47 Kenyan counties...\n');
  
  try {
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        county VARCHAR(100),
        installation_date DATE,
        manufacturer VARCHAR(255),
        serial_number VARCHAR(100),
        capacity VARCHAR(50),
        diameter_mm INTEGER,
        material VARCHAR(100),
        pressure_zone VARCHAR(100),
        dma_id INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ assets table created');

    await db.query(`
      CREATE TABLE IF NOT EXISTS pipelines (
        id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL,
        diameter_mm INTEGER, material VARCHAR(100), length_km DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'active', coordinates JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ pipelines table created');

    await db.query(`
      CREATE TABLE IF NOT EXISTS dmas (
        id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, county VARCHAR(100),
        coverage_km2 DECIMAL(10, 2), population_served INTEGER, boundary JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ dmas table created');

    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_lat_lon ON assets (latitude, longitude)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_county ON assets (county)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status)`);
    console.log('✅ Spatial indexes created\n');

    // All 47 Kenyan counties with representative assets
    const seedData = [
      // 1. Mombasa
      { name: 'Mombasa Island Sensor', type: 'sensor', latitude: -4.0435, longitude: 39.6682, county: 'Mombasa', status: 'active' },
      { name: 'Nyali Reservoir', type: 'reservoir', latitude: -4.0167, longitude: 39.7000, county: 'Mombasa', capacity: '20M liters', status: 'active' },
      // 2. Kwale
      { name: 'Kwale Town Sensor', type: 'sensor', latitude: -4.1733, longitude: 39.2833, county: 'Kwale', status: 'active' },
      // 3. Kilifi
      { name: 'Kilifi Water Tower', type: 'water_tower', latitude: -3.6286, longitude: 39.8499, county: 'Kilifi', status: 'active' },
      // 4. Tana River
      { name: 'Hola Treatment Plant', type: 'treatment_plant', latitude: -1.5000, longitude: 40.0000, county: 'Tana River', status: 'active' },
      // 5. Lamu
      { name: 'Lamu Old Town Sensor', type: 'sensor', latitude: -2.2717, longitude: 40.9020, county: 'Lamu', status: 'active' },
      // 6. Taita-Taveta
      { name: 'Voi Water Tower', type: 'water_tower', latitude: -3.3833, longitude: 38.5667, county: 'Taita-Taveta', status: 'active' },
      // 7. Garissa
      { name: 'Garissa Town Sensor', type: 'sensor', latitude: -0.4532, longitude: 39.6461, county: 'Garissa', status: 'active' },
      // 8. Wajir
      { name: 'Wajir Borehole Sensor', type: 'sensor', latitude: 1.7479, longitude: 40.0572, county: 'Wajir', status: 'active' },
      // 9. Mandera
      { name: 'Mandera Border Sensor', type: 'sensor', latitude: 3.4083, longitude: 40.9789, county: 'Mandera', status: 'active' },
      // 10. Marsabit
      { name: 'Marsabit Water Point', type: 'water_point', latitude: 2.3283, longitude: 37.9900, county: 'Marsabit', status: 'active' },
      // 11. Isiolo
      { name: 'Isiolo Town Sensor', type: 'sensor', latitude: 0.3583, longitude: 37.5833, county: 'Isiolo', status: 'active' },
      // 12. Meru
      { name: 'Meru Town Sensor', type: 'sensor', latitude: 0.0467, longitude: 37.6558, county: 'Meru', status: 'active' },
      { name: 'Nyambene Hills Reservoir', type: 'reservoir', latitude: 0.1500, longitude: 37.8000, county: 'Meru', capacity: '10M liters', status: 'active' },
      // 13. Tharaka-Nithi
      { name: 'Chuka Water Tower', type: 'water_tower', latitude: -0.3333, longitude: 37.6500, county: 'Tharaka-Nithi', status: 'active' },
      // 14. Embu
      { name: 'Embu Town Sensor', type: 'sensor', latitude: -0.5333, longitude: 37.4500, county: 'Embu', status: 'active' },
      // 15. Kitui
      { name: 'Kitui Central Sensor', type: 'sensor', latitude: -1.3667, longitude: 38.0167, county: 'Kitui', status: 'active' },
      // 16. Machakos
      { name: 'Machakos Town Sensor', type: 'sensor', latitude: -1.5167, longitude: 37.2667, county: 'Machakos', status: 'active' },
      { name: 'Machakos Water Tower', type: 'water_tower', latitude: -1.5200, longitude: 37.2700, county: 'Machakos', status: 'active' },
      // 17. Makueni
      { name: 'Wote Treatment Plant', type: 'treatment_plant', latitude: -1.7833, longitude: 37.6167, county: 'Makueni', status: 'active' },
      // 18. Nyandarua
      { name: 'Ol Kalou Sensor', type: 'sensor', latitude: -0.2167, longitude: 36.3667, county: 'Nyandarua', status: 'active' },
      // 19. Nyeri
      { name: 'Nyeri Town Sensor', type: 'sensor', latitude: -0.4167, longitude: 36.9500, county: 'Nyeri', status: 'active' },
      { name: 'Aberdare Reservoir', type: 'reservoir', latitude: -0.5500, longitude: 36.7500, county: 'Nyeri', capacity: '15M liters', status: 'active' },
      // 20. Kirinyaga
      { name: 'Kerugoya Sensor', type: 'sensor', latitude: -0.4833, longitude: 37.2833, county: 'Kirinyaga', status: 'active' },
      // 21. Murang'a
      { name: 'Muranga Town Sensor', type: 'sensor', latitude: -0.7833, longitude: 37.0000, county: 'Muranga', status: 'active' },
      // 22. Kiambu
      { name: 'Kiambu Town Sensor', type: 'sensor', latitude: -1.1719, longitude: 36.8311, county: 'Kiambu', status: 'active' },
      { name: 'Thika Treatment Plant', type: 'treatment_plant', latitude: -1.0333, longitude: 37.0833, county: 'Kiambu', status: 'active' },
      // 23. Turkana
      { name: 'Lodwar Water Point', type: 'water_point', latitude: 3.1167, longitude: 35.6000, county: 'Turkana', status: 'active' },
      // 24. West Pokot
      { name: 'Kapenguria Sensor', type: 'sensor', latitude: 1.2333, longitude: 35.1167, county: 'West Pokot', status: 'active' },
      // 25. Samburu
      { name: 'Maralal Water Tower', type: 'water_tower', latitude: 1.0833, longitude: 36.7000, county: 'Samburu', status: 'active' },
      // 26. Trans-Nzoia
      { name: 'Kitale Town Sensor', type: 'sensor', latitude: 1.0167, longitude: 35.0000, county: 'Trans-Nzoia', status: 'active' },
      // 27. Uasin Gishu
      { name: 'Eldoret Central Sensor', type: 'sensor', latitude: 0.5143, longitude: 35.2698, county: 'Uasin Gishu', status: 'active' },
      { name: 'Eldoret Water Tower', type: 'water_tower', latitude: 0.5333, longitude: 35.2833, county: 'Uasin Gishu', status: 'active' },
      // 28. Elgeyo-Marakwet
      { name: 'Iten Water Tower', type: 'water_tower', latitude: 0.6667, longitude: 35.5500, county: 'Elgeyo-Marakwet', status: 'active' },
      // 29. Nandi
      { name: 'Kapsabet Sensor', type: 'sensor', latitude: 0.1833, longitude: 35.1000, county: 'Nandi', status: 'active' },
      // 30. Baringo
      { name: 'Kabarnet Sensor', type: 'sensor', latitude: 0.5000, longitude: 35.9500, county: 'Baringo', status: 'active' },
      // 31. Laikipia
      { name: 'Nanyuki Treatment Plant', type: 'treatment_plant', latitude: 0.0167, longitude: 37.0667, county: 'Laikipia', status: 'active' },
      // 32. Nakuru
      { name: 'Nakuru Town Sensor', type: 'sensor', latitude: -0.3031, longitude: 36.0800, county: 'Nakuru', status: 'active' },
      { name: 'Lake Naivasha Intake', type: 'treatment_plant', latitude: -0.7167, longitude: 36.4333, county: 'Nakuru', status: 'active' },
      { name: 'Nakuru Reservoir', type: 'reservoir', latitude: -0.2833, longitude: 36.0667, county: 'Nakuru', capacity: '25M liters', status: 'active' },
      // 33. Narok
      { name: 'Narok Town Sensor', type: 'sensor', latitude: -1.0833, longitude: 35.8667, county: 'Narok', status: 'active' },
      // 34. Kajiado
      { name: 'Kajiado Town Sensor', type: 'sensor', latitude: -1.8500, longitude: 36.7833, county: 'Kajiado', status: 'active' },
      { name: 'Ngong Water Tower', type: 'water_tower', latitude: -1.3833, longitude: 36.6833, county: 'Kajiado', status: 'active' },
      // 35. Kericho
      { name: 'Kericho Town Sensor', type: 'sensor', latitude: -0.3667, longitude: 35.2833, county: 'Kericho', status: 'active' },
      // 36. Bomet
      { name: 'Bomet Town Sensor', type: 'sensor', latitude: -0.7833, longitude: 35.3333, county: 'Bomet', status: 'active' },
      // 37. Kakamega
      { name: 'Kakamega Town Sensor', type: 'sensor', latitude: 0.2833, longitude: 34.7500, county: 'Kakamega', status: 'active' },
      { name: 'Kakamega Treatment Plant', type: 'treatment_plant', latitude: 0.3000, longitude: 34.7600, county: 'Kakamega', status: 'active' },
      // 38. Vihiga
      { name: 'Mbale Sensor', type: 'sensor', latitude: 0.0833, longitude: 34.7167, county: 'Vihiga', status: 'active' },
      // 39. Bungoma
      { name: 'Bungoma Town Sensor', type: 'sensor', latitude: 0.5667, longitude: 34.5500, county: 'Bungoma', status: 'active' },
      // 40. Busia
      { name: 'Busia Border Sensor', type: 'sensor', latitude: 0.4600, longitude: 34.1167, county: 'Busia', status: 'active' },
      // 41. Siaya
      { name: 'Siaya Town Sensor', type: 'sensor', latitude: -0.0667, longitude: 34.2500, county: 'Siaya', status: 'active' },
      // 42. Kisumu
      { name: 'Kisumu Central Sensor', type: 'sensor', latitude: -0.0917, longitude: 34.7680, county: 'Kisumu', status: 'active' },
      { name: 'Lake Victoria Intake', type: 'treatment_plant', latitude: -0.1000, longitude: 34.7500, county: 'Kisumu', status: 'active' },
      { name: 'Mamboleo Reservoir', type: 'reservoir', latitude: -0.1167, longitude: 34.7833, county: 'Kisumu', capacity: '15M liters', status: 'active' },
      // 43. Homa Bay
      { name: 'Homa Bay Town Sensor', type: 'sensor', latitude: -0.5167, longitude: 34.4500, county: 'Homa Bay', status: 'active' },
      // 44. Migori
      { name: 'Migori Town Sensor', type: 'sensor', latitude: -1.0667, longitude: 34.4667, county: 'Migori', status: 'active' },
      // 45. Kisii
      { name: 'Kisii Town Sensor', type: 'sensor', latitude: -0.6833, longitude: 34.7667, county: 'Kisii', status: 'active' },
      // 46. Nyamira
      { name: 'Nyamira Town Sensor', type: 'sensor', latitude: -0.5667, longitude: 34.9333, county: 'Nyamira', status: 'active' },
      // 47. Nairobi
      { name: 'Kibera Sensor Node 1', type: 'sensor', latitude: -1.3031, longitude: 36.7989, county: 'Nairobi', status: 'active' },
      { name: 'Westlands Pressure Sensor', type: 'sensor', latitude: -1.2635, longitude: 36.8033, county: 'Nairobi', status: 'active' },
      { name: 'Karen Reservoir Level', type: 'sensor', latitude: -1.3099, longitude: 36.7096, county: 'Nairobi', status: 'active' },
      { name: 'CBD Flow Meter', type: 'sensor', latitude: -1.2864, longitude: 36.8172, county: 'Nairobi', status: 'active' },
      { name: 'Sasumua Dam', type: 'reservoir', latitude: -1.0864, longitude: 36.8896, county: 'Nairobi', capacity: '50M liters', status: 'active' },
      { name: 'Kikuyu Treatment Plant', type: 'treatment_plant', latitude: -1.2500, longitude: 36.6700, county: 'Nairobi', status: 'active' },
      { name: 'Ruiru Water Tower', type: 'water_tower', latitude: -1.1167, longitude: 36.9667, county: 'Nairobi', status: 'active' },
      { name: 'Nairobi Main Valve V-001', type: 'valve', latitude: -1.2800, longitude: 36.8200, county: 'Nairobi', status: 'active' },
      { name: 'Kibera Fire Hydrant H-101', type: 'hydrant', latitude: -1.3050, longitude: 36.8000, county: 'Nairobi', status: 'active' },
      { name: 'Kibera Public Water Point 1', type: 'water_point', latitude: -1.3020, longitude: 36.7995, county: 'Nairobi', status: 'active' },
      { name: 'Mathare Water Kiosk', type: 'water_point', latitude: -1.2583, longitude: 36.8833, county: 'Nairobi', status: 'active' },
      { name: 'Eastleigh Community Tap', type: 'water_point', latitude: -1.2667, longitude: 36.8500, county: 'Nairobi', status: 'active' }
    ];

    for (const asset of seedData) {
      await db.query(
        `INSERT INTO assets (name, type, latitude, longitude, county, status, capacity) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [asset.name, asset.type, asset.latitude, asset.longitude, asset.county, asset.status, asset.capacity]
      );
    }
    console.log(`✅ Seeded ${seedData.length} assets across all 47 counties`);

    // DMA zones
    const dmaData = [
      { name: 'Nairobi Central DMA', county: 'Nairobi', coverage_km2: 15.2, population_served: 250000, boundary: [[-1.2900, 36.8200], [-1.2900, 36.8300], [-1.3000, 36.8300], [-1.3000, 36.8200]] },
      { name: 'Mombasa Island DMA', county: 'Mombasa', coverage_km2: 8.5, population_served: 120000, boundary: [[-4.0500, 39.6600], [-4.0500, 39.6700], [-4.0600, 39.6700], [-4.0600, 39.6600]] },
      { name: 'Kisumu Central DMA', county: 'Kisumu', coverage_km2: 12.0, population_served: 180000, boundary: [[-0.0900, 34.7600], [-0.0900, 34.7700], [-0.1000, 34.7700], [-0.1000, 34.7600]] },
      { name: 'Nakuru Town DMA', county: 'Nakuru', coverage_km2: 10.5, population_served: 150000, boundary: [[-0.3100, 36.0700], [-0.3100, 36.0900], [-0.3000, 36.0900], [-0.3000, 36.0700]] },
      { name: 'Eldoret Central DMA', county: 'Uasin Gishu', coverage_km2: 9.8, population_served: 140000, boundary: [[0.5100, 35.2600], [0.5100, 35.2800], [0.5200, 35.2800], [0.5200, 35.2600]] }
    ];

    for (const dma of dmaData) {
      await db.query(
        `INSERT INTO dmas (name, county, coverage_km2, population_served, boundary) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [dma.name, dma.county, dma.coverage_km2, dma.population_served, JSON.stringify(dma.boundary)]
      );
    }
    console.log(`✅ Seeded ${dmaData.length} DMA zones`);

    // Pipelines
    const pipelineData = [
      { name: 'Nairobi Trunk Main A', diameter_mm: 500, material: 'Ductile Iron', length_km: 12.5, coordinates: [[-1.2921, 36.8219], [-1.2950, 36.8150], [-1.3000, 36.8100]] },
      { name: 'Mombasa Distribution Line', diameter_mm: 300, material: 'PVC', length_km: 8.2, coordinates: [[-4.0435, 39.6682], [-4.0300, 39.6800], [-4.0167, 39.7000]] },
      { name: 'Kisumu Lake Victoria Pipeline', diameter_mm: 400, material: 'Steel', length_km: 15.0, coordinates: [[-0.1000, 34.7500], [-0.0917, 34.7680], [-0.0800, 34.7800]] }
    ];

    for (const pipeline of pipelineData) {
      await db.query(
        `INSERT INTO pipelines (name, diameter_mm, material, length_km, coordinates) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
        [pipeline.name, pipeline.diameter_mm, pipeline.material, pipeline.length_km, JSON.stringify(pipeline.coordinates)]
      );
    }
    console.log(`✅ Seeded ${pipelineData.length} pipeline connections`);

    console.log('\n🎉 GIS production migrations completed successfully!');
    console.log(`📊 Database now contains infrastructure from all 47 Kenyan counties\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ GIS migration failed:', error.message);
    process.exit(1);
  }
}

runGISMigrations();
