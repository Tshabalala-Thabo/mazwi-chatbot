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

    const keys = Object.keys(rows[0]);
    const placeholders = keys.map(() => "?").join(",");

    const stmt = db.prepare(
        `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(",")})
     VALUES (${placeholders})`
    );

    const insertMany = db.transaction(data => {
        for (const row of data) {
            stmt.run(Object.values(row));
        }
    });

    insertMany(rows);
}

function walk(obj, prefix = "") {
    for (const key in obj) {
        const value = obj[key];
        const tableName = prefix ? `${prefix}_${key}` : key;

        if (Array.isArray(value)) {
            createTable(tableName, value);
        } else if (typeof value === "object") {
            walk(value, tableName);
        }
    }
}

walk(json);

console.log("✅ SQLite database created");
