export interface IContentCreatorSearchService {
  /**
   * Search for content creator IDs by name (full-text search)
   * @param searchTerm - The search term to match against name field
   * @returns Array of content creator IDs that match the search
   */
  searchByName(searchTerm: string): Promise<string[]>;
}
