// Follow Deno and Supabase Edge Function conventions
import { createClient } from "npm:@supabase/supabase-js@2";

// OpenAI API configuration
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface RequestBody {
  subject: string;
  topic: string;
  grade?: string;
  count?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('Generate questions function called');
    console.log('Environment check:', {
      hasOpenAIKey: !!OPENAI_API_KEY,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseServiceKey,
      openAIKeyLength: OPENAI_API_KEY?.length || 0
    });

    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate OpenAI API key format
    if (!OPENAI_API_KEY.startsWith('sk-')) {
      console.error('Invalid OpenAI API key format');
      return new Response(
        JSON.stringify({ error: "Invalid OpenAI API key format" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json() as RequestBody;
    } catch (parseError) {
      console.error('Failed to parse request body:', String(parseError));
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { subject, topic, grade = "High School", count = 10 } = requestBody;

    console.log('Request parameters:', { subject, topic, grade, count });

    if (!subject || !topic) {
      console.error('Missing required parameters:', { subject, topic });
      return new Response(
        JSON.stringify({ error: "Subject and topic are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if we already have enough questions for this subject/topic
    console.log(`Checking for existing questions for ${subject}/${topic}...`);
    const { data: existingQuestions, error: queryError } = await supabase
      .from("ai_game_questions")
      .select("*")
      .eq("subject", subject)
      .eq("topic", topic);

    if (queryError) {
      console.error("Error querying existing questions:", queryError);
      return new Response(
        JSON.stringify({ error: "Database query failed", details: queryError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (existingQuestions && existingQuestions.length >= count) {
      // We already have enough questions, return them
      console.log(`Found ${existingQuestions.length} existing questions, returning them`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Retrieved existing questions", 
          questions: existingQuestions 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Need to generate ${count - (existingQuestions?.length || 0)} new questions`);

    // Generate new questions using OpenAI
    const mcqCount = Math.ceil(count * 0.6); // 60% MCQs
    const tfCount = Math.floor(count * 0.4);  // 40% True/False

    const prompt = `Generate educational questions for ${grade} students studying ${subject}, specifically on the topic of "${topic}".

Please create:
- ${mcqCount} multiple-choice questions with exactly 4 options each (labeled A, B, C, D)
- ${tfCount} true/false questions

For each question:
1. Make sure the content is factually accurate and grade-appropriate
2. For multiple-choice questions, ensure exactly one correct answer
3. For true/false questions, clearly indicate if the statement is true or false
4. Avoid ambiguous or trick questions

Format your response as a valid JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": [{"id": "A", "text": "First option"}, {"id": "B", "text": "Second option"}, {"id": "C", "text": "Third option"}, {"id": "D", "text": "Fourth option"}],
    "correct_answer": "A",
    "type": "multiple_choice"
  },
  {
    "question": "True/false statement here.",
    "correct_answer": "True",
    "type": "true_false"
  }
]`;

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        }),
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an educational content creator specializing in creating accurate, engaging questions for students."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
    } catch (fetchError) {
      console.error('Failed to call OpenAI API:', fetchError);
      console.error('Error details:', String(fetchError));
      return new Response(
        JSON.stringify({ error: "Failed to connect to OpenAI API", details: String(fetchError) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { status: response.status, statusText: response.statusText };
      }
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate questions", details: errorData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse OpenAI response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let generatedQuestions;

    try {
      // Extract the content from the response
      const content = data.choices[0].message.content;
      console.log('OpenAI response content length:', content?.length || 0);
      console.log('OpenAI response sample:', content?.substring(0, 100) + '...');
      
      // Clean the content by removing Markdown code blocks
      let cleanedContent = content;
      if (content.includes('```')) {
        cleanedContent = content.replace(/```json|```/g, '').trim();
        console.log('Cleaned Markdown from content');
      }
      
      // Parse the JSON from the cleaned content
      try {
        generatedQuestions = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Attempted to parse content:', cleanedContent.substring(0, 100) + '...');
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
      
      // Validate the structure
      if (!Array.isArray(generatedQuestions)) {
        throw new Error("Response is not an array");
      }

      console.log(`Successfully parsed ${generatedQuestions.length} questions from OpenAI`);
    } catch (error) {
      console.error("Error parsing OpenAI response:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse generated questions", 
          raw_response: data.choices[0].message.content 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare questions for database insertion
    const questionsToInsert = generatedQuestions.map((q: any) => ({
      subject,
      topic,
      question: q.question,
      options: q.type === 'multiple_choice' ? q.options : null,
      correct_answer: q.correct_answer,
      type: q.type,
      created_by: 'gpt'
    }));

    console.log(`Inserting ${questionsToInsert.length} questions into database...`);

    // Insert questions into the database
    const { data: insertedQuestions, error: insertError } = await supabase
      .from("ai_game_questions")
      .insert(questionsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting questions:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save generated questions", details: insertError }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully inserted ${insertedQuestions?.length || 0} questions`);

    // Return the generated and saved questions
    const allQuestions = [...(existingQuestions || []), ...(insertedQuestions || [])];
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Generated and saved new questions", 
        questions: allQuestions 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      type: typeof error
    });
    
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: errorMessage,
        stack: errorStack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});