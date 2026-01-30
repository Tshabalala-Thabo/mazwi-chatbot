# Quick Setup Guide for Mazwi Chatbot

## Step 1: Get Your OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)

## Step 2: Create Environment File

Create a file named `.env.local` in the project root:

```bash
# In your terminal, run:
touch .env.local
```

## Step 3: Add Your API Key

Open `.env.local` and add:

```env
OPENAI_API_KEY=sk-proj-your-actual-key-here
```

Replace `sk-proj-your-actual-key-here` with your actual OpenAI API key.

## Step 4: Restart the Server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

## Step 5: Test the Chatbot

1. Log in to the dashboard
2. Click the **Mazwi icon** in the bottom-right corner
3. Try asking: "What are my critical risks?"

## That's it! 🎉

The chatbot is now ready to help you with your GRC data.

## Need Help?

- See `CHATBOT_README.md` for detailed documentation
- Check browser console for errors
- Verify your API key is correct
