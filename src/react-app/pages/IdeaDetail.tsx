import { useParams } from 'react-router-dom';

function IdeaDetail() {
  const { ideaId } = useParams();
  return (
    <div>
      <h2>Detail Page for Idea ID: {ideaId}</h2>
      {/* Render actual content for the idea */}
      <p>This is the content for idea with ID: {ideaId}</p>
    </div>
  );
}

export default IdeaDetail;