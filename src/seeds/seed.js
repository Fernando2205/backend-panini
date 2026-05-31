const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function seed() {
  try {
    console.log('Ejecutando schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '001_schema.sql'), 'utf8');
    await pool.query(schemaSql);
    console.log('Schema creado exitosamente');

    console.log('Importando datos de laminas...');
    const laminasSqlPath = path.join(__dirname, '..', '..', '..', 'laminas_panini_2026.sql');

    if (!fs.existsSync(laminasSqlPath)) {
      console.error('No se encontro el archivo laminas_panini_2026.sql en la raiz del proyecto');
      process.exit(1);
    }

    let laminasSql = fs.readFileSync(laminasSqlPath, 'utf8');

    laminasSql = laminasSql.replace(/drop table laminas_panini_2026;/gi, '');
    laminasSql = laminasSql.replace(/drop table paises_mundial_2026;/gi, '');
    laminasSql = laminasSql.replace(/CREATE TABLE paises_mundial_2026[\s\S]*?\);/gi, '');
    laminasSql = laminasSql.replace(/INSERT INTO paises_mundial_2026[\s\S]*?PANAMA', 'L'\);\n/gi, '');
    laminasSql = laminasSql.replace(/CREATE TABLE laminas_panini_2026[\s\S]*?\);/gi, '');
    laminasSql = laminasSql.replace(/ALTER TABLE laminas_panini_2026[\s\S]*?REFERENCES paises_mundial_2026\(iso3\);/gi, '');
    laminasSql = laminasSql.replace(/TRUNCATE TABLE laminas_panini_2026;/gi, '');
    laminasSql = laminasSql.replace(/select \* from laminas_panini_2026[\s\S]*?;/gi, '');
    laminasSql = laminasSql.replace(/select count\(\*\) from laminas_panini_2026[\s\S]*?;/gi, '');

    const statements = laminasSql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length > 0) {
        try {
          await pool.query(trimmed + ';');
        } catch (err) {
          if (err.code !== '23505') {
            console.error('Error en statement:', err.message);
          }
        }
      }
    }

    const countResult = await pool.query('SELECT COUNT(*) FROM laminas_panini_2026');
    console.log(`Total laminas importadas: ${countResult.rows[0].count}`);

    const paisesResult = await pool.query('SELECT COUNT(*) FROM paises_mundial_2026');
    console.log(`Total paises: ${paisesResult.rows[0].count}`);

    console.log('Seed completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
