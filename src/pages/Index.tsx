import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TypewriterText } from '@/components/TypewriterText';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import jakeBackground from '@/assets/jake-background.jpg';
import PageTransition from '@/components/PageTransition';

const Index = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a LinkedIn post URL',
        variant: 'destructive',
      });
      return;
    }

    if (!url.includes('linkedin.com')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid LinkedIn URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-linkedin', {
        body: { 
          url,
          format: "Create a single, complete sentence using 15-20 words maximum that captures the core message and key insight." 
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
  // Navigate to the summary page with the summary data
  // include the original URL so the summary page can link back to the author/profile
  navigate('/summary', { state: { summary: data.summary, originalUrl: url } });
    } catch (error) {
      console.error('Summarization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize the post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div 
      className="min-h-screen bg-background flex items-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${jakeBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative z-10 w-full max-w-3xl ml-4 md:ml-8 lg:ml-12 space-y-8">
        <div className="space-y-2">
          <div className="flex flex-col items-start">
            <h1 className="font-doto text-7xl md:text-8xl font-black text-primary tracking-wider leading-none mb-4">
              TLDR
            </h1>
            <div className="font-doto text-2xl md:text-3xl text-primary">
              <TypewriterText 
                texts={["Too Long Didn't Read."]} 
                speed={80}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
          <Input
            type="url"
            placeholder="Paste LinkedIn post URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSummarize()}
            className="flex-1 h-14 bg-input text-primary-foreground placeholder:text-muted-foreground border-0 rounded-full px-6 font-medium"
            disabled={isLoading}
          />
          <Button
            onClick={handleSummarize}
            disabled={isLoading}
            className="h-14 px-8 rounded-full bg-black/80 hover:bg-black text-white font-doto text-lg tracking-wide border border-white/20 transition-colors duration-200"
          >
            {isLoading ? 'Summarizing...' : 'Summarize'}
          </Button>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Index;
