require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper function to format messages for different APIs
const formatMessages = (messages) => {
  return messages.map(msg => ({
    role: msg.sender === 'User' ? 'user' : 'assistant',
    content: msg.text
  }));
};

// OpenAI API call
const callOpenAI = async (messages, personality) => {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are participating in a multi-AI conversation. Your personality is: "${personality}". Please respond naturally to the user's question while also engaging with what the previous AI(s) said. Keep your response to about 1 paragraph. You can agree, disagree, add to, or build upon the previous AI responses.`
    };
    
    const formattedMessages = [systemMessage, ...formatMessages(messages)];
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: formattedMessages,
      max_tokens: 200, // Limit to encourage shorter responses
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return 'Sorry, I encountered an error with OpenAI.';
  }
};

// Google AI (Gemini) API call
const callGemini = async (messages, personality) => {
  try {
    const currentMessage = messages[messages.length - 1];
    
    let prompt;
    const previousAIs = messages.filter(msg => msg.sender !== 'User' && msg.sender !== 'System');
    
    if (previousAIs.length > 0) {
      const lastAI = previousAIs[previousAIs.length - 1];
      prompt = `You are participating in a multi-AI conversation with other AI assistants. Your personality is: "${personality}".

Previous AI (${lastAI.sender}) said: "${lastAI.text}"

User's question: ${currentMessage.text}

Please respond naturally to the user's question while also engaging with what the previous AI said. You can agree, disagree, add to, or build upon their response. Keep your response to about 1 paragraph.`;
    } else {
      prompt = `You are participating in a multi-AI conversation with other AI assistants. Your personality is: "${personality}".

User's question: ${currentMessage.text}

Please provide your response to the user's question. Keep your response to about 1 paragraph. Other AI assistants may respond after you.`;
    }
    
    console.log('Calling Gemini API with message:', prompt);
    console.log('Using API key:', process.env.GOOGLE_AI_API_KEY ? 'Present' : 'Missing');
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };
    
    console.log('Gemini request body:', JSON.stringify(requestBody, null, 2));
    
    // Try the Google AI Studio endpoint
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }
    
    return 'Sorry, I received an empty response from Gemini.';
  } catch (error) {
    console.error('Gemini API error details:');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error headers:', error.response?.headers);
    
    if (error.response?.status === 400) {
      return `Invalid request to Gemini API: ${error.response.data?.error?.message || 'Bad request'}`;
    } else if (error.response?.status === 403) {
      return 'Authentication error with Gemini API. Please check your API key.';
    } else if (error.response?.status === 404) {
      return 'Gemini API endpoint not found. Please check the API URL or model name.';
    } else if (error.response?.status === 429) {
      return 'Rate limit exceeded for Gemini API. Please try again later.';
    } else if (error.code === 'ENOTFOUND') {
      return 'Network error: Could not connect to Gemini API.';
    } else if (error.code === 'ECONNABORTED') {
      return 'Request timeout: Gemini API took too long to respond.';
    }
    return `Sorry, I encountered an error with Gemini: ${error.message}`;
  }
};

// Anthropic (Claude) API call
const callClaude = async (messages, personality) => {
  try {
    const instructionMessage = {
      role: 'user',
      content: `You are participating in a multi-AI conversation. Your personality is: "${personality}". You will see responses from previous AI assistants. Please respond naturally to the user's question while also engaging with what the previous AI(s) said. Keep your response to about 1 paragraph.`
    };

    const allMessages = [instructionMessage, ...formatMessages(messages)];
    
    console.log('Claude API request messages:', JSON.stringify(allMessages, null, 2));
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 200, // Limit to encourage shorter responses
      messages: allMessages
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });
    
    if (response.data.content && response.data.content.length > 0) {
      return response.data.content[0].text;
    } else {
      return 'Sorry, I received an empty response from Claude.';
    }
  } catch (error) {
    console.error('Claude API error details:');
    console.error('Error message:', error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    
    if (error.response?.status === 401) {
      return 'Authentication error with Claude API. Please check your API key.';
    } else if (error.response?.status === 400) {
      return `Invalid request to Claude API: ${error.response.data?.error?.message || 'Bad request format'}`;
    } else if (error.response?.status === 413) {
      return 'Message too long for Claude API. Please try a shorter message.';
    }
    return `Sorry, I encountered an error with Claude: ${error.message}`;
  }
};

// Health check functions for each AI service
const checkOpenAIHealth = async () => {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return { available: true, error: null };
  } catch (error) {
    console.error('OpenAI health check failed:', error.response?.data || error.message);
    return { 
      available: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

const checkGeminiHealth = async () => {
  try {
    const requestBody = {
      contents: [{
        parts: [{
          text: 'test'
        }]
      }]
    };
    
    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      return { available: true, error: null };
    } else {
      return { available: false, error: 'Empty response from Gemini' };
    }
  } catch (error) {
    console.error('Gemini health check failed:', error.response?.data || error.message);
    return { 
      available: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

const checkClaudeHealth = async () => {
  try {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 10000
    });
    
    if (response.data.content && response.data.content.length > 0) {
      return { available: true, error: null };
    } else {
      return { available: false, error: 'Empty response from Claude' };
    }
  } catch (error) {
    console.error('Claude health check failed:', error.response?.data || error.message);
    return { 
      available: false, 
      error: error.response?.data?.error?.message || error.message 
    };
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    console.log('Performing health checks for all AI services...');
    
    const [openAIHealth, geminiHealth, claudeHealth] = await Promise.allSettled([
      checkOpenAIHealth(),
      checkGeminiHealth(),
      checkClaudeHealth()
    ]);
    
    const healthStatus = {
      chatgpt: {
        available: openAIHealth.status === 'fulfilled' ? openAIHealth.value.available : false,
        error: openAIHealth.status === 'fulfilled' ? openAIHealth.value.error : 'Health check failed'
      },
      gemini: {
        available: geminiHealth.status === 'fulfilled' ? geminiHealth.value.available : false,
        error: geminiHealth.status === 'fulfilled' ? geminiHealth.value.error : 'Health check failed'
      },
      claude: {
        available: claudeHealth.status === 'fulfilled' ? claudeHealth.value.available : false,
        error: claudeHealth.status === 'fulfilled' ? claudeHealth.value.error : 'Health check failed'
      }
    };
    
    console.log('Health check results:', healthStatus);
    res.json(healthStatus);
  } catch (error) {
    console.error('Health check endpoint error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, agents } = req.body;

  if (!agents || agents.length === 0) {
    return res.status(400).json({ error: 'No agents provided.' });
  }

  console.log('Received message:', messages.slice(-1)[0].text);
  console.log('Processing with agents:', agents.map(a => a.name));

  const responses = [];
  let currentMessages = [...messages];

  for (const agent of agents) {
    console.log(`Calling agent: ${agent.name} (${agent.model})...`);
    let responseText;

    const callFunction = {
      gemini: callGemini,
      chatgpt: callOpenAI,
      claude: callClaude
    }[agent.model];

    if (callFunction) {
      responseText = await callFunction(currentMessages, agent.personality);
    } else {
      console.error(`Unknown model: ${agent.model}`);
      responseText = `Error: Unknown model '${agent.model}' for agent '${agent.name}'.`;
    }
    
    const newResponse = {
      text: responseText,
      sender: agent.name,
      order: responses.length + 1
    };
    
    responses.push(newResponse);
    currentMessages.push({ text: responseText, sender: agent.name });
  }

  console.log('Sending responses:', responses);
  res.json({ responses });
});

app.post('/api/continue', async (req, res) => {
  const { messages, agents } = req.body;

  if (!agents || agents.length === 0) {
    return res.status(400).json({ error: 'No agents provided.' });
  }

  console.log('Continuing conversation with agents:', agents.map(a => a.name));

  const responses = [];
  let currentMessages = [...messages];

  for (const agent of agents) {
    console.log(`Continuing with agent: ${agent.name} (${agent.model})...`);
    let responseText;

    const callFunction = {
      gemini: callGemini,
      chatgpt: callOpenAI,
      claude: callClaude
    }[agent.model];

    if (callFunction) {
      responseText = await callFunction(currentMessages, agent.personality);
    } else {
      console.error(`Unknown model: ${agent.model}`);
      responseText = `Error: Unknown model '${agent.model}' for agent '${agent.name}'.`;
    }
    
    const newResponse = {
      text: responseText,
      sender: agent.name,
      order: responses.length + 1
    };
    
    responses.push(newResponse);
    currentMessages.push({ text: responseText, sender: agent.name });
  }

  console.log('Sending continuation responses:', responses);
  res.json({ responses });
});

// Summarization endpoint using Gemini
app.post('/api/summarize', async (req, res) => {
  const { messages } = req.body;
  
  if (!messages || messages.length === 0) {
    return res.json({ summary: 'No messages to summarize' });
  }

  try {
    // Format conversation for summarization
    const conversationText = messages.map(msg => 
      `${msg.sender}: ${msg.text}`
    ).join('\n\n');

    const summaryPrompt = `Please provide a concise summary of this multi-AI conversation. Focus on the main topics discussed, key insights shared by the different AI assistants, and any conclusions reached. Keep the summary to 2-3 sentences maximum.

Conversation:
${conversationText}

Summary:`;

    const requestBody = {
      contents: [{
        parts: [{
          text: summaryPrompt
        }]
      }]
    };

    const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const summary = candidate.content.parts[0].text;
        res.json({ summary });
      } else {
        res.json({ summary: 'Failed to generate summary' });
      }
    } else {
      res.json({ summary: 'Failed to generate summary' });
    }
  } catch (error) {
    console.error('Summarization error:', error);
    res.json({ summary: 'Error generating summary' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
