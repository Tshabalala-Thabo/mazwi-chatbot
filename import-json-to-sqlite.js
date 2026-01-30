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
            // Convert arrays and objects to JSON strings
            const values = keys.map(key => {
                const value = row[key];
                if (value === undefined) return null;
                if (value === null) return null;
                if (typeof value === 'object') return JSON.stringify(value);
                if (typeof value === 'boolean') return value ? 1 : 0;
                return value;
            });
            stmt.run(values);
        }
    });

    insertMany(rows);
}

function walk(obj, prefix = "") {
    for (const key in obj) {
        const value = obj[key];
        
        // Avoid duplicate prefixes in table names
        let tableName;
        if (!prefix) {
            tableName = key;
        } else if (key.startsWith(prefix + "_")) {
            // If key already starts with prefix, use key as-is
            tableName = key;
        } else if (key === prefix || key === prefix + "s" || prefix === key + "s") {
            // If key is singular/plural of prefix, use the key
            tableName = key;
        } else {
            // Otherwise, combine prefix and key
            tableName = `${prefix}_${key}`;
        }

        if (Array.isArray(value)) {
            createTable(tableName, value);
        } else if (typeof value === "object") {
            walk(value, tableName);
        }
    }
}

walk(json);

console.log("✅ SQLite database created");
