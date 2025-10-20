import './PageInfo.scss';

interface PageInfoProps {
  title: string | null;
  description: string | null;
  url: string;
}

function PageInfo({ title, description, url }: PageInfoProps) {
  return (
    <div className="page-info">
      <h2 className="page-title">{title || 'Untitled Page'}</h2>
      {description && (
        <p className="page-description">{description}</p>
      )}
      <div className="page-url">{url}</div>
    </div>
  );
}

export default PageInfo;

