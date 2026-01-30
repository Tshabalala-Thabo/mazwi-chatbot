# Mazwi AI Chatbot - ProSuite GRC Assistant

## Overview
An intelligent AI-powered chatbot assistant that helps users interact with their ProSuite GRC data using natural language. The chatbot is tenant-aware and can query data across all modules within the user's organization.

## Features

### 🤖 AI-Powered Assistance
- **OpenAI Integration**: Uses GPT-4o-mini for intelligent responses
- **Tenant-Aware**: Only accesses data from the user's organization
- **Context-Aware**: Understands conversation history and maintains context
- **Multi-Module Support**: Can query data from all GRC modules:
  - Risk Management
  - Asset Management
  - Incident Management
  - Audit Management
  - Compliance Management
  - Governance Management

### 🎨 User Interface
- **Bottom-Right Corner**: Non-intrusive placement
- **Animated Icon**: Alternates between static and animated versions
  - Animated GIF shows for 2 seconds
  - Static PNG shows for 8 seconds
  - Total cycle: 10 seconds
- **Popup Chat Window**: Clean, modern chat interface
- **Smooth Animations**: Professional transitions and interactions
- **Mobile Responsive**: Works on all screen sizes

### 📊 Data Access
The chatbot can query and analyze:
- **Risk Statistics**: Total risks, critical/high risks, risk scores
- **Asset Information**: Asset inventory, costs, categories, status
- **Incident Data**: Open incidents, severity levels, recent events
- **Audit Status**: Active audits, engagement details, findings
- **Compliance Metrics**: Package status, compliance scores, requirements
- **Governance Policies**: Active policies, review dates, status
- **Organizational Data**: Departments, users, sites, locations

### 🔒 Security
- **Session-Based**: Requires authenticated user session
- **Tenant Isolation**: Users can only access their organization's data
- **API Key Security**: OpenAI key stored in environment variables
- **No Data Leakage**: Strict tenant_id filtering on all queries

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (you won't see it again!)

### 2. Configure Environment Variables
1. Create a `.env.local` file in the project root:
   ```bash
   cp env.example .env.local
   ```

2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

### 3. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Usage

### Opening the Chatbot
- Click the **Mazwi icon** in the bottom-right corner
- The chat window will popup with a welcome message

### Asking Questions
The chatbot can answer questions like:
- "What are my critical risks?"
- "Show me recent incidents"
- "What's our compliance status?"
- "How many assets do we have?"
- "What audits are currently active?"
- "Tell me about our governance policies"
- "Which departments have the most risks?"
- "What's the total value of our IT assets?"

### Example Queries

**Risk Management:**
- "What are our top 5 risks?"
- "How many critical risks do we have?"
- "Show me risks in the IT department"

**Asset Management:**
- "What's our total asset value?"
- "List our most expensive assets"
- "How many active assets do we have?"

**Compliance:**
- "What's our POPIA compliance score?"
- "Show me overdue compliance requirements"
- "Which compliance packages need attention?"

**Incidents:**
- "What incidents are currently open?"
- "Show me recent security incidents"
- "How many incidents occurred this month?"

**Audits:**
- "What audits are in progress?"
- "Show me recent audit findings"
- "When is the next audit scheduled?"

**Governance:**
- "Which policies need review?"
- "Show me active governance policies"
- "What's our policy compliance status?"

## Technical Details

### Architecture

**Frontend Component** (`components/Chatbot.tsx`)
- React component with state management
- Icon animation toggle with intervals
- Message history and conversation flow
- Real-time loading states

**Backend API** (`app/api/chat/route.ts`)
- Session validation
- OpenAI API integration
- Conversation history management
- Error handling

**Context Builder** (`lib/chatbot-context.ts`)
- Tenant data aggregation
- Dynamic query generation
- System prompt construction
- Multi-table data joining

### Data Flow
1. User sends message → Frontend
2. Frontend → API endpoint with message + history
3. API validates session → Gets tenant context
4. API queries relevant database tables
5. API builds system prompt with context
6. API calls OpenAI with prompt + message
7. OpenAI returns response
8. API returns response → Frontend
9. Frontend displays message in chat

### Icon Animation Logic
```typescript
// Show animated for 2s, static for 8s
setInterval(() => {
  setIsAnimated(true);
  setTimeout(() => setIsAnimated(false), 2000);
}, 10000);
```

### Database Queries
The chatbot intelligently queries based on keywords:
- Detects keywords in user message
- Fetches relevant data from appropriate tables
- Limits results to prevent overwhelming the AI
- Always filters by tenant_id for security

## Customization

### Changing Animation Timing
Edit `components/Chatbot.tsx`:
```typescript
// Current: 2s animated, 8s static
setTimeout(() => setIsAnimated(false), 2000); // Animated duration
}, 10000); // Total cycle
```

### Modifying AI Behavior
Edit `lib/chatbot-context.ts` - `buildSystemPrompt()`:
- Adjust personality and tone
- Add/remove capabilities
- Change response style

### Adding New Data Sources
Edit `lib/chatbot-context.ts` - `queryTenantData()`:
```typescript
if (queryLower.includes('your_keyword')) {
  results.yourData = db.prepare('YOUR SQL QUERY').all(tenantId);
}
```

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `.env.local` file exists
- Check that `OPENAI_API_KEY` is set
- Restart the development server

### "Invalid OpenAI API key"
- Verify your API key is correct
- Check if key has been revoked
- Ensure you have API credits

### Chatbot not responding
- Check browser console for errors
- Verify user is logged in
- Check API endpoint logs

### No data in responses
- Verify database has data for your tenant
- Check tenant_id in session
- Review database queries in context builder

## Cost Considerations

### OpenAI API Usage
- Model: GPT-4o-mini (cost-effective)
- Average tokens per request: ~500-1000
- Estimated cost: $0.0001-0.0003 per message
- Monthly estimate (1000 messages): ~$0.10-$0.30

### Optimization Tips
- Limit conversation history (currently 10 messages)
- Use max_tokens limit (currently 1000)
- Cache frequently accessed data
- Implement rate limiting for production

## Future Enhancements

### Potential Features
- [ ] Voice input/output
- [ ] File upload and analysis
- [ ] Export conversation history
- [ ] Suggested questions
- [ ] Multi-language support
- [ ] Custom AI training on GRC data
- [ ] Integration with external GRC tools
- [ ] Automated report generation
- [ ] Proactive risk alerts
- [ ] Scheduled compliance reminders

## Files Created

```
├── components/
│   └── Chatbot.tsx                    # Main chatbot UI component
├── app/api/
│   └── chat/
│       └── route.ts                   # OpenAI API integration
├── lib/
│   └── chatbot-context.ts             # Tenant data & context builder
├── env.example                        # Environment variable template
└── CHATBOT_README.md                  # This file
```

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check API endpoint responses
4. Verify OpenAI API status

## License
ISC
