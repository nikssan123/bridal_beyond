-- Migration: add sport_dances category to listings
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_category_check;
ALTER TABLE listings
  ADD CONSTRAINT listings_category_check
  CHECK (category IN ('wedding', 'graduation', 'evening', 'sport_dances'));

