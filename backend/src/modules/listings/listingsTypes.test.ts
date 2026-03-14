import { categories, conditions } from './listingsTypes';

describe('listingsTypes', () => {
  describe('categories', () => {
    it('includes wedding, graduation, evening', () => {
      expect(categories).toContain('wedding');
      expect(categories).toContain('graduation');
      expect(categories).toContain('evening');
      expect(categories).toHaveLength(3);
    });
  });

  describe('conditions', () => {
    it('includes new, like-new, good, fair', () => {
      expect(conditions).toContain('new');
      expect(conditions).toContain('like-new');
      expect(conditions).toContain('good');
      expect(conditions).toContain('fair');
      expect(conditions).toHaveLength(4);
    });
  });
});
