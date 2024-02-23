DROP TABLE IF EXISTS LNXlink;
CREATE TABLE IF NOT EXISTS LNXlink (
	pk INTEGER PRIMARY KEY AUTOINCREMENT,
	uuid UUID NOT NULL,
	version VARCHAR(30),
	country VARCHAR(5),
	created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);