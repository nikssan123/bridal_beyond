INSERT INTO listing_stats (id, max_active_price) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
