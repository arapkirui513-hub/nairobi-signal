import { SignalHigh, TrendingUp } from "lucide-react";
import SearchBar from '@/components/SearchBar';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getHighSignal() {
  // .gte(column, value) filters for "Greater Than or Equal To"
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .gte('signal_score', 5.0) 
    .order('published_at', { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    return [];
  }
  return data;
}

export default async function Home() {
  const articles = await getHighSignal();

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Nairobi<span className="text-green-600">Signal</span>
            </h1>
            <p className="text-slate-500 font-medium italic">High-Signal Intelligence Only</p>
          </div>
          <div className="bg-green-600 p-3 rounded-full text-white shadow-lg">
            <SignalHigh size={28} />
          </div>
        </header>

        <SearchBar />

        <div className="space-y-6">
          {articles && articles.length > 0 ? (
            articles.map((article: any) => (
              <div key={article.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-green-400 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                    Score {article.signal_score}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {new Date(article.published_at).toLocaleDateString('en-KE')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{article.title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-2">{article.summary}</p>
                
                {/* Visual Metadata: Why did this score high? */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.score_metadata?.components?.map((c: any, i: number) => (
                    <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase font-bold">
                      {c.type.replace('_', ' ')}
                    </span>
                  ))}
                </div>

                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-green-600 font-bold text-sm flex items-center gap-1 hover:underline">
                  READ FULL ANALYSIS <TrendingUp size={14} />
                </a>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400 font-medium">No structural shifts detected yet. Monitoring the ecosystem...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
