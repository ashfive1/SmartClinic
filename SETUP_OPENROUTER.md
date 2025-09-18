# OpenRouter API Setup for Google Gemma 3N E4B IT

## 🚀 Quick Setup

### 1. Get OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy the key (starts with `sk-or-...`)

### 2. Add to Environment
Add this line to your `.env.local` file:

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
```

### 3. Restart Your App
```bash
npm run dev
```

## 🆓 Free Model Available

**Google Gemma 3N E4B IT** is available for **FREE** on OpenRouter:
- ✅ **No cost** for this model
- ✅ **Professional medical AI** capabilities
- ✅ **Text and image** analysis
- ✅ **High quality** responses

## 🧪 Test Your Setup

1. **Check Configuration**: Visit `http://localhost:3000/api/test-gemma3n`
2. **Test Medical Query**: Try asking "What are the symptoms of hypertension?"
3. **Test Image Upload**: Upload a medical image and ask about it

## 🔄 Fallback System

If OpenRouter is not configured, the system automatically falls back to:
1. **Llama 3.1 8B** (via Groq) for text queries
2. **BLIP** (via Hugging Face) for image analysis

## 💡 Benefits of OpenRouter

- **Unified API** for multiple AI models
- **Free tier** available
- **Professional models** like Google Gemma 3N E4B IT
- **Reliable service** with good uptime
- **Easy integration** with your existing setup

## 🏥 Medical AI Capabilities

With Google Gemma 3N E4B IT, you get:
- **Clinical decision support**
- **Medical image analysis**
- **Symptom interpretation**
- **Treatment recommendations**
- **Drug interaction checks**
- **Medical literature insights**

## 📞 Support

If you need help:
1. Check the [OpenRouter documentation](https://openrouter.ai/docs)
2. Verify your API key is correct
3. Ensure your `.env.local` file is properly configured
4. Restart your development server

---

**Ready to use professional medical AI for free!** 🎉
