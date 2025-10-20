import { useRef, useEffect } from 'react';
import { Visit } from '../../api/client';
import './HistoryList.scss';

interface HistoryListProps {
  history: Visit[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

function HistoryList({ history, hasMore, loading, onLoadMore }: HistoryListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, onLoadMore]);

  if (history.length === 0 && !loading) {
    return (
      <div className="history-list">
        <h2>Visit History</h2>
        <p className="empty">No visits recorded yet.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="history-list">
      <h2>Visit History</h2>
      <div className="history-items">
        {history.map((visit) => (
          <div key={visit.id} className="history-item">
            <div className="history-header">
              <div className="history-time">{formatDate(visit.datetime_visited)}</div>
            </div>
            {visit.title && <div className="history-title">{visit.title}</div>}
            {visit.description && <div className="history-description">{visit.description}</div>}
            <div className="history-stats">
              <span className="stat">
                <span className="stat-label">Links:</span> {visit.link_count}
              </span>
              <span className="stat">
                <span className="stat-label">Words:</span> {visit.word_count}
              </span>
              <span className="stat">
                <span className="stat-label">Images:</span> {visit.image_count}
              </span>
            </div>
          </div>
        ))}
        
        {hasMore && (
          <div ref={observerTarget} className="load-more-trigger">
            {loading && <div className="loading-indicator">Loading more...</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryList;
