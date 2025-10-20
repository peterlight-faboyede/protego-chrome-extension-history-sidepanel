import { Metrics } from '../../api/client';
import './MetricsCard.scss';

interface MetricsCardProps {
  currentMetrics: {
    link_count: number;
    word_count: number;
    image_count: number;
  } | null;
  aggregatedMetrics: Metrics | null;
}

function MetricsCard({ currentMetrics, aggregatedMetrics }: MetricsCardProps) {
  if (!currentMetrics && !aggregatedMetrics) {
    return null;
  }

  return (
    <div className="metrics-card">
      <h2>Page Metrics</h2>
      
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-label">Links</span>
          <span className="metric-value">{currentMetrics?.link_count || 0}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Words</span>
          <span className="metric-value">{currentMetrics?.word_count || 0}</span>
        </div>

        <div className="metric">
          <span className="metric-label">Images</span>
          <span className="metric-value">{currentMetrics?.image_count || 0}</span>
        </div>

        {aggregatedMetrics && (
          <div className="metric">
            <span className="metric-label">Total Visits</span>
            <span className="metric-value">{aggregatedMetrics.total_visits}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsCard;

