CREATE TABLE IF NOT EXISTS vocap_sync_cursors (
    network TEXT NOT NULL,
    router_address TEXT NOT NULL,
    next_block BIGINT NOT NULL CHECK (next_block >= 0),
    block_hash TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (network, router_address)
);

-- Upgrade installations created by the original network-only cursor schema.
ALTER TABLE vocap_sync_cursors ADD COLUMN IF NOT EXISTS router_address TEXT;
ALTER TABLE vocap_sync_cursors ADD COLUMN IF NOT EXISTS block_hash TEXT;
UPDATE vocap_sync_cursors SET router_address = '__legacy__' WHERE router_address IS NULL;
ALTER TABLE vocap_sync_cursors ALTER COLUMN router_address SET DEFAULT '__legacy__';
ALTER TABLE vocap_sync_cursors ALTER COLUMN router_address SET NOT NULL;
ALTER TABLE vocap_sync_cursors DROP CONSTRAINT IF EXISTS vocap_sync_cursors_pkey;
ALTER TABLE vocap_sync_cursors ADD CONSTRAINT vocap_sync_cursors_pkey PRIMARY KEY (network, router_address);

CREATE TABLE IF NOT EXISTS vocap_indexed_blocks (
    network TEXT NOT NULL,
    router_address TEXT NOT NULL,
    block_number BIGINT NOT NULL CHECK (block_number >= 0),
    block_hash TEXT NOT NULL,
    parent_hash TEXT,
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (network, router_address, block_number),
    UNIQUE (network, router_address, block_hash)
);

CREATE TABLE IF NOT EXISTS vocap_policies (
    network TEXT NOT NULL,
    router_address TEXT NOT NULL,
    policy_id NUMERIC(78, 0) NOT NULL,
    token_address TEXT NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    target_address TEXT NOT NULL,
    selector TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    mode TEXT NOT NULL CHECK (mode = 'RETURN'),
    last_seen_block BIGINT NOT NULL,
    last_seen_tx_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (network, router_address, policy_id)
);

CREATE TABLE IF NOT EXISTS vocap_transactions (
    network TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'reverted')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    PRIMARY KEY (network, tx_hash)
);

CREATE TABLE IF NOT EXISTS vocap_executions (
    event_key TEXT PRIMARY KEY,
    network TEXT NOT NULL,
    router_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL,
    event_index INTEGER NOT NULL CHECK (event_index >= 0),
    block_number BIGINT NOT NULL CHECK (block_number >= 0),
    block_hash TEXT NOT NULL,
    policy_id NUMERIC(78, 0) NOT NULL,
    target_address TEXT NOT NULL,
    selector TEXT NOT NULL,
    token_address TEXT NOT NULL,
    amount NUMERIC(78, 0) NOT NULL,
    note_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status = 'accepted'),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (network, router_address, tx_hash, event_index)
);
