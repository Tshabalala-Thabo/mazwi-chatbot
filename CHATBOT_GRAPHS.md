# Mazwi Chatbot - Graph Visualization Feature

## Overview
The Mazwi AI chatbot now supports automatic graph visualization for data analysis. When you ask questions about statistics, distributions, or comparisons, the AI will automatically generate visual charts alongside text explanations.

## Supported Graph Types

### 📊 Bar Charts
**Best for:** Comparing values across categories
**Examples:**
- "Show me assets by category"
- "Compare risks across departments"
- "What's the breakdown of incidents by type?"

### 🥧 Pie Charts
**Best for:** Showing distributions and proportions
**Examples:**
- "What's the risk severity distribution?"
- "Show me incident status breakdown"
- "What percentage of assets are active?"

### 📈 Line Charts
**Best for:** Showing trends over time
**Examples:**
- "Show me incident trends over the past months"
- "How have our risks changed over time?"
- "Display compliance score trends"

## How It Works

### Automatic Detection
The AI automatically determines when to use graphs based on your question. If you're asking about:
- Statistics
- Comparisons
- Distributions
- Breakdowns
- Trends

...the AI will include a relevant graph in its response.

### Example Queries

**Query:** "What are my risks by severity?"

**Response:** 
- 📊 **Pie chart** showing risk distribution (Critical, High, Medium, Low)
- Text explanation with specific numbers and insights

**Query:** "Show me assets by category"

**Response:**
- 📊 **Bar chart** comparing asset counts across categories
- Text summary of findings

**Query:** "How many incidents do we have by status?"

**Response:**
- 🥧 **Pie chart** showing incident status distribution
- Detailed breakdown with recommendations

## Technical Implementation

### Graph Parsing
The AI embeds special markers in its responses:
```
[GRAPH:type:title]
[{"name":"Category","value":10}]
[/GRAPH]
```

The chatbot automatically:
1. Detects these markers
2. Parses the graph data
3. Renders the appropriate chart type
4. Displays it above the text response

### Supported Data Format
```json
[
  {"name": "Category 1", "value": 25},
  {"name": "Category 2", "value": 15},
  {"name": "Category 3", "value": 30}
]
```

### Color Scheme
Graphs use the ProSuite primary color palette:
- Primary: `#036DAD` (ProSuite Blue)
- Variations: Lighter and darker shades for multiple data points
- Consistent with overall UI design

## Features

### Interactive Charts
- **Hover tooltips:** See exact values on hover
- **Responsive design:** Charts adapt to container size
- **Clean styling:** Professional appearance with subtle borders and shadows

### Smart Visualization
- **Automatic type selection:** AI chooses the best chart type for your data
- **Multiple graphs:** Can show multiple charts in one response
- **Data limits:** Keeps charts readable (max 10 items per chart)

## Example Use Cases

### Risk Management
```
You: "Show me our top risks by severity"
Mazwi: [Displays pie chart] + "Your organization has 5 critical risks..."
```

### Asset Analysis
```
You: "What's our asset distribution by category?"
Mazwi: [Displays bar chart] + "IT Equipment represents the largest category..."
```

### Compliance Tracking
```
You: "Show me compliance package status"
Mazwi: [Displays pie chart] + "2 of your 3 compliance packages are compliant..."
```

### Incident Monitoring
```
You: "How many open incidents do we have?"
Mazwi: [Displays bar chart by severity] + "You currently have 3 open incidents..."
```

## Tips for Best Results

### Be Specific
❌ "Tell me about risks"
✅ "Show me risks by severity level"

### Ask for Comparisons
❌ "What assets do we have?"
✅ "Compare assets by category"

### Request Distributions
❌ "List incidents"
✅ "What's the incident status distribution?"

### Use Action Words
- "Show me..."
- "Compare..."
- "Display..."
- "What's the breakdown of..."
- "Analyze..."

## Customization

### Chart Colors
Edit `components/ChatGraph.tsx` to change colors:
```typescript
const COLORS = ['#036DAD', '#0284c7', '#38bdf8', ...];
```

### Chart Size
Adjust height in `ChatGraph.tsx`:
```typescript
<ResponsiveContainer width="100%" height={250}>
```

### Data Limits
Modify the AI prompt in `lib/chatbot-context.ts`:
```typescript
- Keep data arrays concise (max 10 items)
```

## Files Modified

```
├── components/
│   ├── Chatbot.tsx              # Added graph parsing and rendering
│   └── ChatGraph.tsx            # New: Graph component (bar, pie, line)
├── lib/
│   └── chatbot-context.ts       # Updated: AI prompt with graph instructions
└── package.json                 # Added: recharts dependency
```

## Dependencies

**Recharts** - React charting library
- Lightweight and performant
- Responsive by default
- Easy to customize
- Well-maintained

## Troubleshooting

### Graphs Not Showing
1. Check browser console for errors
2. Verify OpenAI API key is configured
3. Ensure recharts is installed: `npm install recharts`
4. Try asking more specific questions

### Incorrect Graph Type
The AI chooses the graph type automatically. If you want a specific type:
- "Show me a bar chart of..."
- "Display a pie chart for..."
- "Create a line graph of..."

### Data Not Displaying
- Ensure your tenant has data in the database
- Try asking about different modules
- Check that the query matches available data

## Future Enhancements

Potential improvements:
- [ ] Export graphs as images
- [ ] More chart types (scatter, area, radar)
- [ ] Custom color themes per module
- [ ] Interactive filtering on charts
- [ ] Drill-down capabilities
- [ ] Time-series analysis
- [ ] Comparison across time periods
- [ ] Animated transitions

## Performance

- **Rendering:** Fast, client-side rendering
- **Data size:** Optimized for small to medium datasets
- **Memory:** Minimal impact on browser performance
- **API calls:** No additional API calls for graphs

## Accessibility

- Charts include descriptive titles
- Tooltips provide exact values
- Color contrast meets WCAG standards
- Text alternatives available in message content

## License
ISC
