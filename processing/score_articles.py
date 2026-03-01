import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

HIGH_SIGNAL = ["funding", "raise", "million", "expansion", "partnership", "policy", "startup", "investment"]
LOW_SIGNAL = ["aviator", "winner", "betting", "gambling", "gossip"]

def score_articles():
    # Fetch articles that haven't been scored yet
    articles = supabase.table("articles").select("*").eq("signal_score", 0.0).execute()
    print(f"Processing {len(articles.data)} articles...")

    for article in articles.data:
        score = 0.5  # Base neutral score
        text = (article['title'] + " " + article['summary']).lower()

        # Simple keyword scoring
        for word in HIGH_SIGNAL:
            if word in text:
                score += 1.5
        
        for word in LOW_SIGNAL:
            if word in text:
                score -= 2.0

        # Clamp score between 0 and 10
        final_score = max(0.0, min(10.0, score))

        # Update the database
        supabase.table("articles").update({"signal_score": final_score}).eq("id", article['id']).execute()
        print(f"  Scored [{final_score}]: {article['title'][:50]}...")

if __name__ == "__main__":
    score_articles()
