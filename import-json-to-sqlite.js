// import-json-to-sqlite.js
const fs = require("fs");
const Database = require("better-sqlite3");

const json = JSON.parse(fs.readFileSync("./prosuite-demo-data.json", "utf8"));
const db = new Database("database.sqlite");

function createTable(table, rows) {
    if (!rows.length) return;

    // Collect all unique keys from all rows to handle inconsistent schemas
    const allKeys = new Set();
    rows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    const keys = Array.from(allKeys);

    // Determine the data type for each column by examining all values
    const columnTypes = {};
    keys.forEach(key => {
        let hasInteger = false;
        let hasReal = false;
        let hasOther = false;

        rows.forEach(row => {
            const value = row[key];
            if (value !== null && value !== undefined) {
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        hasInteger = true;
                    } else {
                        hasReal = true;
                    }
                } else if (typeof value !== 'boolean') {
                    hasOther = true;
                }
            }
        });

        // Determine type: prefer INTEGER, then REAL, then TEXT
        if (hasOther || (hasInteger && hasReal)) {
            columnTypes[key] = 'TEXT';
        } else if (hasReal) {
            columnTypes[key] = 'REAL';
        } else if (hasInteger) {
            columnTypes[key] = 'INTEGER';
        } else {
            columnTypes[key] = 'TEXT';
        }
    });

    const columns = keys
        .map(k => `"${k}" ${columnTypes[k]}`)
        .join(",");

    db.prepare(`CREATE TABLE IF NOT EXISTS "${table}" (${columns})`).run();

    const placeholders = keys.map(() => "?").join(",");

    const stmt = db.prepare(
        `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(",")})
     VALUES (${placeholders})`
    );

    const insertMany = db.transaction(data => {
        for (const row of data) {
            // Create values array in the same order as keys, filling missing fields with null
            const values = keys.map(key => {
                const value = row[key];
                
                if (value === undefined) {
                    return null;
                }
                if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    return JSON.stringify(value);
                }
                // Ensure booleans are converted to integers
                if (typeof value === 'boolean') {
                    return value ? 1 : 0;
                }
                return value;
            });
            
            try {
                stmt.run(values);
            } catch (error) {
                console.error(`Error inserting into table "${table}":`, error.message);
                console.error('Row data:', JSON.stringify(row, null, 2));
                console.error('Processed values:', values);
                throw error;
            }
        }
    });

    insertMany(rows);
}

function normalizeTableName(prefix, key) {
    // If no prefix, just return the key
    if (!prefix) return key;
    
    // Check if key is a plural form of prefix (e.g., "asset" -> "assets")
    // or if they share the same root word
    const prefixLower = prefix.toLowerCase();
    const keyLower = key.toLowerCase();
    
    // If key starts with prefix, just use the key (e.g., "asset" + "assets" = "assets")
    if (keyLower.startsWith(prefixLower) || prefixLower.startsWith(keyLower)) {
        return key;
    }
    
    // Check for common plural patterns
    const singularToPlural = {
        [prefixLower]: keyLower,
        [prefixLower + 's']: keyLower,
        [prefixLower + 'es']: keyLower,
        [prefixLower + 'ies']: keyLower.replace(/ies$/, 'y')
    };
    
    // If they're related (singular/plural), just use the key
    if (Object.values(singularToPlural).includes(keyLower)) {
        return key;
    }
    
    // Otherwise, combine them with underscore
    return `${prefix}_${key}`;
}

function walk(obj, prefix = "") {
    for (const key in obj) {
        const value = obj[key];
        const tableName = normalizeTableName(prefix, key);

        if (Array.isArray(value)) {
            createTable(tableName, value);
        } else if (typeof value === "object") {
            walk(value, tableName);
        }
    }
}

walk(json);

console.log("✅ SQLite database created");
