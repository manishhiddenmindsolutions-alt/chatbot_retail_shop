/**
 * Service to communicate with the n8n HMS Retail Cloth Shop AI Agent Webhook
 */

const WEBHOOK_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '/api-webhook/webhook/94a57911-26f6-47c8-9eb3-cdac0c4faddd'
  : 'https://n8n.propwiseai.in/webhook/94a57911-26f6-47c8-9eb3-cdac0c4faddd';

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  available: 'Yes' | 'No';
  description: string;
  rating: number;
  status: 'In Demand' | 'Limited Stock' | 'Best Seller';
}

export interface WebhookResponse {
  text: string;
  clothingItems?: ClothingItem[];
  error?: boolean;
}

// Exactly the three requested retail cloth items!
export const mockClothingItems: ClothingItem[] = [
  {
    id: "PR001",
    name: "Black Hoodie",
    category: "Hoodie",
    size: "M",
    color: "Black",
    price: 1499,
    stock: 10,
    available: "Yes",
    description: "Premium heavy-knit streetwear hoodie crafted from organic combed cotton. Features double-lined hood, kangaroo pocket, and relaxed classic fit.",
    rating: 4.8,
    status: "Best Seller"
  },
  {
    id: "PR002",
    name: "Blue Jeans",
    category: "Jeans",
    size: "32",
    color: "Blue",
    price: 1999,
    stock: 8,
    available: "Yes",
    description: "Classic straight-fit denim engineered from authentic selvedge cotton. Tailored with custom copper rivets and a vintage light-wash fade.",
    rating: 4.9,
    status: "Limited Stock"
  },
  {
    id: "PR003",
    name: "White T-Shirt",
    category: "T-Shirt",
    size: "L",
    color: "White",
    price: 799,
    stock: 15,
    available: "Yes",
    description: "Essential minimalist tee stitched from breathable bamboo-cotton jersey. Features a reinforced crewneck and ultra-soft, tagless interior.",
    rating: 4.75,
    status: "In Demand"
  }
];

/**
 * Generate unique session ID for the styling session
 */
export const generateSessionId = (): string => {
  return 'hms_apparel_session_' + Math.random().toString(36).substring(2, 15);
};

/**
 * Robustly parses n8n webhook response in any shape (Object, Array, Stringified JSON)
 */
export function parseWebhookReply(rawData: any): WebhookResponse {
  if (!rawData) {
    return { text: "I did not receive a response from our styling assistant. Please try again." };
  }

  // 1. Handle arrays elegantly
  let dataObj = rawData;
  if (Array.isArray(dataObj)) {
    if (dataObj.length > 0) {
      dataObj = dataObj[0];
    } else {
      return { text: "Received an empty response from our styling assistant." };
    }
  }

  // 2. Handle stringified JSON recursively
  if (typeof dataObj === 'string') {
    let trimmed = dataObj.trim();
    
    // Check if it's wrapped in markdown code blocks (e.g. ```json ... ``` or ``` ... ```)
    const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
    const match = trimmed.match(markdownRegex);
    if (match) {
      trimmed = match[1].trim();
    }
    
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseWebhookReply(parsed);
      } catch (e) {
        // Fall back to treating as a regular string below
      }
    }
  }

  // 3. Handle object parsing
  if (typeof dataObj === 'object' && dataObj !== null) {
    // Extract potential clothing items array list
    let itemsList: ClothingItem[] = [];
    if (dataObj.data && Array.isArray(dataObj.data.clothingItems)) {
      itemsList = dataObj.data.clothingItems;
    } else if (Array.isArray(dataObj.clothingItems)) {
      itemsList = dataObj.clothingItems;
    } else if (Array.isArray(dataObj.data)) {
      itemsList = dataObj.data;
    }

    // Extract core text messages from robust list of possible response fields
    const messageText = dataObj.message || dataObj.output || dataObj.text || dataObj.msg || dataObj.response || dataObj.reply || dataObj.result || '';
    
    // Check if the extracted message text is nested stringified JSON
    if (typeof messageText === 'string') {
      let trimmed = messageText.trim();
      const markdownRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
      const match = trimmed.match(markdownRegex);
      if (match) {
        trimmed = match[1].trim();
      }
      
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          const parsed = JSON.parse(trimmed);
          const subResult = parseWebhookReply(parsed);
          if (subResult.text) {
            if (itemsList.length > 0 && !subResult.clothingItems) {
              subResult.clothingItems = itemsList;
            }
            return subResult;
          }
        } catch (e) {
          // Fall back to plain text return
        }
      }
    }

    if (messageText) {
      return {
        text: messageText,
        clothingItems: itemsList.length > 0 ? itemsList : undefined
      };
    }

    // If it's a generic JSON object with no explicit message field, stringify it clearly
    return {
      text: JSON.stringify(dataObj, null, 2),
      clothingItems: itemsList.length > 0 ? itemsList : undefined
    };
  }

  // 4. Default raw string parsing
  let cleanedText = String(dataObj).trim();
  if (cleanedText.startsWith('"') && cleanedText.endsWith('"')) {
    cleanedText = cleanedText.slice(1, -1).trim();
  }

  return { text: cleanedText };
}

/**
 * Send query to the n8n HMS Retail Cloth AI Agent via POST
 */
export async function sendMessageToAgent(
  message: string,
  sessionId: string
): Promise<WebhookResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 90000); // 90 seconds timeout

  try {
    const payload = {
      message,
      sessionId
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new Error(`n8n Webhook returned 404 (Not Registered)`);
    }

    if (!response.ok) {
      throw new Error(`Server returned status code ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }

    // Try parsing the webhook reply
    const reply = parseWebhookReply(data);
    
    // Format literal escaped newlines to actual linebreaks for proper markdown render
    if (reply.text) {
      reply.text = reply.text.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }

    return reply;

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('HMS Apparel Webhook is offline or timed out.', error);

    return {
      text: "### ⚠️ HMS Stylist Offline\n\nCould not establish a connection to the **HMS Apparel AI Assistant Webhook**.\n\n* **Status**: Webhook Inactive / n8n Offline\n* **Action Required**: Please ensure your n8n workflow webhook is active in your editor.\n\n*Your custom webhook endpoint is currently not responding to chat queries.*",
      error: true
    };
  }
}
