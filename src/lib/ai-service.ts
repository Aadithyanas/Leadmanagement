import { Lead } from '@/types';

export async function generateProposalEmail(
  apiKey: string,
  lead: Lead,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing. Please add it in Settings.');
  }

  const systemMessage = `You are an expert sales representative. Your goal is to write a highly professional, persuasive, and concise proposal email to a potential client.
You will be provided with the lead's details and the specific points/offer the user wants to include.
Format the email cleanly with a clear subject line. If the user provides a link or drive link, incorporate it naturally.
Do NOT include any placeholder text like [Your Name] or [Your Company] if you can avoid it, try to make it ready-to-send based on the user's input.
CRITICAL FORMATTING INSTRUCTION: DO NOT use any Markdown formatting like **asterisks for bold** or # hashes for headers. Output plain text ONLY. Use standard line breaks and dashes (-) for bullet points.`;

  const userMessage = `
Lead Name: ${lead.name}
Company: ${lead.company || 'Their Company'}
Industry: ${lead.industry || 'N/A'}

I want to send them a proposal. Here are the key points to include in the email:
${prompt}

Please write the email. Include a "Subject: " line at the top.
  `.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin, // Required by OpenRouter
      'X-Title': 'LeadFlow CRM', // Optional
    },
    body: JSON.stringify({
      model: 'openrouter/auto', // Let OpenRouter auto-select the best model
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to generate proposal from OpenRouter');
  }

  const data = await response.json();
  let content = data.choices[0].message.content || '';
  
  // Clean up any stray markdown formatting the AI might have ignored
  content = content.replace(/\*\*/g, ''); // Remove bold asterisks
  content = content.replace(/^#+\s/gm, ''); // Remove header hashes
  
  return content;
}

export async function generateWelcomeEmail(
  apiKey: string,
  lead: Lead,
  prompt: string
): Promise<string> {
  if (!apiKey) throw new Error('OpenRouter API key is missing.');

  const systemMessage = `You are an expert sales representative. Your goal is to write a highly professional, friendly, and concise welcome/introductory email to a new lead.
Do NOT include any placeholder text like [Your Name] or [Your Company] if you can avoid it.
CRITICAL FORMATTING INSTRUCTION: DO NOT use any Markdown formatting like **asterisks for bold** or # hashes for headers. Output plain text ONLY. Use standard line breaks.`;

  const userMessage = `
Lead Name: ${lead.name}
Company: ${lead.company || 'Their Company'}
Industry: ${lead.industry || 'N/A'}

I want to welcome this new lead. Here are some optional points to include:
${prompt}

Please write the email. Include a "Subject: " line at the top.
  `.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LeadFlow CRM',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate welcome email from OpenRouter');
  
  const data = await response.json();
  let content = data.choices[0].message.content || '';
  content = content.replace(/\*\*/g, '').replace(/^#+\s/gm, '');
  return content;
}

export async function generateFollowUpEmail(
  apiKey: string,
  lead: Lead,
  prompt: string
): Promise<string> {
  if (!apiKey) throw new Error('OpenRouter API key is missing.');

  const systemMessage = `You are an expert sales representative. Your goal is to write a highly professional, concise follow-up email to a lead who hasn't responded recently.
Be polite and offer value without being pushy.
Do NOT include any placeholder text if you can avoid it.
CRITICAL FORMATTING INSTRUCTION: DO NOT use any Markdown formatting like **asterisks for bold** or # hashes for headers. Output plain text ONLY.`;

  const userMessage = `
Lead Name: ${lead.name}
Company: ${lead.company || 'Their Company'}
Industry: ${lead.industry || 'N/A'}

I want to follow up with them. Here are some optional points to include:
${prompt}

Please write the email. Include a "Subject: " line at the top.
  `.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LeadFlow CRM',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error('Failed to generate follow-up email from OpenRouter');
  
  const data = await response.json();
  let content = data.choices[0].message.content || '';
  content = content.replace(/\*\*/g, '').replace(/^#+\s/gm, '');
  return content;
}

export async function scoreLeadQuality(
  apiKey: string,
  lead: Lead
): Promise<{ score: number, reasoning: string }> {
  if (!apiKey) throw new Error('OpenRouter API key is missing.');

  const systemMessage = `You are an expert B2B sales analyst. Your job is to analyze a lead's profile and determine if they are a high-quality prospect or a waste of time.
Return ONLY a JSON object with this exact structure:
{
  "score": number, // 1 to 10
  "reasoning": "A 1-sentence explanation of why they received this score."
}`;

  const customFieldsStr = Object.entries(lead.customFields)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const userMessage = `
Analyze this lead:
Name: ${lead.name}
Email: ${lead.email || 'N/A'}
Phone: ${lead.phone || 'N/A'}
Company: ${lead.company || 'N/A'}
Industry: ${lead.industry || 'N/A'}
Status: ${lead.status}
Source: ${lead.sourceCategory || 'N/A'}
Requirements: ${lead.requirements || 'N/A'}
Custom Fields:
${customFieldsStr}
  `.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LeadFlow CRM',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }),
  });

  if (!response.ok) throw new Error('Failed to score lead.');
  
  const data = await response.json();
  try {
    const result = JSON.parse(data.choices[0].message.content);
    return {
      score: result.score || 5,
      reasoning: result.reasoning || "Could not determine reasoning."
    };
  } catch (e) {
    return { score: 5, reasoning: "Failed to parse AI response." };
  }
}

export interface AIReport {
  overview: string;
  bottlenecks: {
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  recommendations: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
}

export async function generateAIAnalytics(
  apiKey: string,
  leads: any[],
  members: any[]
): Promise<AIReport> {
  if (!apiKey) throw new Error('OpenRouter API key is missing.');

  const systemMessage = `You are an expert Sales Manager and AI Data Analyst.
You will be provided with a JSON dump of the company's leads and team members.
Your goal is to provide a comprehensive, strategic analysis of the sales pipeline.

You MUST return your analysis ONLY as a valid JSON object matching this exact structure:
{
  "overview": "A 2-3 sentence high-level summary of the pipeline health.",
  "bottlenecks": [
    {
      "title": "e.g., High Rejection Rate",
      "description": "Explanation of the bottleneck...",
      "severity": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "title": "e.g., Prioritize Follow-ups",
      "description": "Detailed actionable recommendation...",
      "impact": "high" | "medium" | "low"
    }
  ]
}

Ensure you provide exactly 2-3 bottlenecks, and 3-4 recommendations.
Do NOT output any markdown, HTML, or other text outside the JSON.`;

  // Compress data to save tokens
  const compressedLeads = leads.map(l => ({
    status: l.status,
    industry: l.industry,
    source: l.source,
    value: l.estimatedValue || 0,
    assignedToId: l.assignedTo,
    createdAt: l.createdAt
  }));
  
  const compressedMembers = members.map(m => ({
    id: m.id,
    name: m.name || m.email,
    role: m.role
  }));

  const userMessage = `
Here is the raw data for the current pipeline:

TEAM MEMBERS:
${JSON.stringify(compressedMembers, null, 2)}

LEADS:
${JSON.stringify(compressedLeads, null, 2)}

Please provide the structured analysis report in JSON.
  `.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'LeadFlow CRM',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    }),
  });

  if (response.status === 429) {
    throw new Error('API Rate Limit Exceeded. Please try again later or upgrade your OpenRouter account limit.');
  }
  if (!response.ok) throw new Error('Failed to generate AI analytics.');
  
  const data = await response.json();
  try {
    const result = JSON.parse(data.choices[0].message.content);
    return result as AIReport;
  } catch (e) {
    console.error("Failed to parse AI response:", data.choices[0].message.content);
    throw new Error("AI returned invalid data format.");
  }
}

