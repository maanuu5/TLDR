// The following imports are for the Supabase Edge Function (Deno runtime).
// Add ts-ignore to avoid local TypeScript/IDE errors in a Node-based toolchain.
// @ts-ignore
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno for the editor/typechecker so 'Deno.env' doesn't error locally.
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Received LinkedIn URL:', url);

    if (!url || !url.includes('linkedin.com')) {
      return new Response(
        JSON.stringify({ error: 'Invalid LinkedIn URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the LinkedIn post content
    console.log('Fetching LinkedIn post content...');
    let postContent = '';
    
    try {
      // Use a simple fetch to get the page content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const html = await response.text();
      
      // Extract post content using simple regex
      // LinkedIn posts usually have content in meta tags or specific divs
      const ogDescriptionMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
      const twitterDescriptionMatch = html.match(/<meta name="twitter:description" content="([^"]+)"/);
      
      postContent = ogDescriptionMatch?.[1] || twitterDescriptionMatch?.[1] || '';
      
      // If still no content, try to extract from the page title
      if (!postContent) {
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        postContent = titleMatch?.[1] || 'LinkedIn post content not available';
      }
      
      console.log('Extracted post content:', postContent.substring(0, 100) + '...');
    } catch (fetchError) {
      console.error('Error fetching LinkedIn post:', fetchError);
      postContent = 'Unable to fetch post content. The post may be private or require authentication.';
    }

    // Use Lovable AI to summarize the content
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI for summarization...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a master summarizer. Create ONE concise, detailed sentence that captures the essence of LinkedIn posts. Be specific and informative. No fluff.'
          },
          {
            role: 'user',
            content: `Summarize this LinkedIn post in ONE detailed sentence:\n\n${postContent}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate summary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;
    console.log('Generated summary:', summary);

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-linkedin function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
