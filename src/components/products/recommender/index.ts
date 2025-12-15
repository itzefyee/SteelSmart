// Product Recommender sub-components
// Split from the monolithic ProductRecommenderNew.tsx for better performance and maintainability

export { default as RequirementsForm } from './RequirementsForm';
export { default as RecommendationsList } from './RecommendationsList';
export { CatalogMatchCard, AlternativeCard, RankedCard, getScoreColor, getScoreLabel } from './RecommendationCard';
