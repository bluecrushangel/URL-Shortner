-- Table to store shortened URLs
CREATE TABLE IF NOT EXISTS urls (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Table to store every click event
CREATE TABLE IF NOT EXISTS clicks (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) NOT NULL,
    timestamp   TIMESTAMP DEFAULT NOW(),
    ip          VARCHAR(50),
    country     VARCHAR(100),
    device      VARCHAR(50),
    FOREIGN KEY (code) REFERENCES urls(code)
);