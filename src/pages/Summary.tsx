import { useLocation, useNavigate } from 'react-router-dom';
import catBackground from '/cat.jpg';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageTransition from '@/components/PageTransition';

const Summary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { summary, originalUrl } = location.state as { summary: string; originalUrl?: string };

  const handleBack = () => {
    navigate('/');
  };

  const handleViewAuthor = () => {
    // Try to extract a profile path from the original post URL (e.g. /in/username or /company/name)
    if (!originalUrl) {
      return;
    }

    const match = originalUrl.match(/(\/in\/[^\/?#]+)|(\/company\/[^\/?#]+)/);
    const profileUrl = match ? `https://www.linkedin.com${match[0]}` : originalUrl;

    // Open in a new tab
    window.open(profileUrl, '_blank');
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex bg-black">
      {/* Left Section */}
      <div className="w-1/2 p-6 flex flex-col justify-center h-screen">
        <Button
          onClick={handleBack}
          className="w-fit mb-4 bg-transparent border-2 border-white hover:bg-white hover:text-black transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-transparent border-2 border-white rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-3">Key Takeaway</h2>
          <p className="text-xl font-medium leading-tight tracking-wide">
            {summary}
          </p>
        </div>
        <div className="mt-4">
          <Button
            onClick={handleViewAuthor}
            className="w-fit mt-3 bg-transparent border-2 border-white hover:bg-white hover:text-black transition-colors"
          >
            View Author
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Right Section */}
      <div 
        className="w-1/2"
        style={{
          backgroundImage: `url(${catBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
    </PageTransition>
  );
};

export default Summary;