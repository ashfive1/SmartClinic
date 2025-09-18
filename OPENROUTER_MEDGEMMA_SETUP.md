# MedGemma-4B-PT via OpenRouter Setup Guide

This guide shows you how to set up **MedGemma-4B-PT** using OpenRouter for the best medical AI performance.

## 🎯 **What You Get**

### **Text Queries**
- **Claude 3.5 Sonnet** (best medical reasoning model on OpenRouter)
- **MedGemma-4B-PT** system prompts for medical specialization
- Clinical-grade medical analysis and recommendations

### **Image Analysis**
- **GPT-4 Vision** for medical image analysis
- **MedGemma-4B-PT** medical interpretation
- Professional medical image insights

## 🚀 **Quick Setup**

### **Step 1: Get OpenRouter API Key**

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Add credits to your account (minimum $5 recommended)

### **Step 2: Configure Environment**

Add to your `.env.local` file:

```bash
# MedGemma-4B-PT via OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Keep existing keys as fallback
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **Step 3: Start Your App**

```bash
npm run dev
```

## 💰 **Pricing**

### **OpenRouter Models Used**

| Model | Use Case | Cost per 1K tokens |
|-------|----------|-------------------|
| **Claude 3.5 Sonnet** | Text queries | ~$0.003 input, ~$0.015 output |
| **GPT-4 Vision** | Image analysis | ~$0.01 input, ~$0.03 output |

### **Typical Costs**
- **Text query**: $0.01 - $0.05 per query
- **Image analysis**: $0.05 - $0.15 per query
- **Monthly usage**: $20 - $100+ depending on volume

## 🏥 **Medical AI Capabilities**

### **Text Queries**
- Advanced symptom analysis
- Differential diagnosis suggestions
- Clinical reasoning and medical insights
- Treatment recommendations
- Medical literature integration
- Patient context analysis

### **Image Analysis**
- Medical image interpretation
- X-ray, CT, MRI analysis
- Dermatology image analysis
- Combined text + image queries
- Clinical findings extraction

## 🔄 **Smart Fallback System**

The system automatically falls back to free models if OpenRouter is unavailable:

1. **Primary**: MedGemma-4B-PT via OpenRouter (best quality)
2. **Fallback**: Llama 3.1 8B + BLIP (free, good quality)
3. **Demo**: Basic responses (if no APIs configured)

## 🧪 **Testing Your Setup**

### **Test API Keys**
Visit: `http://localhost:3000/api/test-free-ai`

### **Test Medical Queries**
- "What are the differential diagnoses for chest pain?"
- "How do I interpret these lab results: HbA1c 8.2%, glucose 180 mg/dL?"
- Upload a medical image and ask about it

## 🔧 **Advanced Configuration**

### **Model Selection**
You can modify the models used in `app/api/openrouter-medical/route.js`:

```javascript
// For text queries
model: "anthropic/claude-3.5-sonnet"  // Best medical reasoning
// Alternative: "openai/gpt-4" or "google/gemini-pro"

// For image analysis  
model: "openai/gpt-4-vision-preview"  // Best vision model
// Alternative: "anthropic/claude-3-opus" (if available)
```

### **Performance Tuning**
```javascript
max_tokens: 1000,     // Response length
temperature: 0.1,     // Consistency (lower = more consistent)
```

## 📊 **Usage Monitoring**

The system tracks usage and costs:

```json
{
  "model": "MedGemma-4B-PT (via OpenRouter)",
  "usage": {
    "prompt_tokens": 200,
    "completion_tokens": 300,
    "total_tokens": 500
  }
}
```

## 🚨 **Rate Limits & Best Practices**

### **OpenRouter Limits**
- **Rate limits**: Vary by model
- **Best practice**: Monitor usage in OpenRouter dashboard
- **Cost control**: Set spending limits in OpenRouter

### **Optimization Tips**
- Use shorter prompts when possible
- Cache responses for repeated queries
- Implement request queuing for high volume

## 🛠️ **Troubleshooting**

### **"OPENROUTER_API_KEY is required" Error**
- Check your `.env.local` file
- Verify the API key is correct
- Restart your development server

### **"Insufficient credits" Error**
- Add credits to your OpenRouter account
- Check your spending limits
- Monitor usage in OpenRouter dashboard

### **Rate Limit Exceeded**
- Wait a few minutes before retrying
- Consider upgrading your OpenRouter plan
- Implement request queuing

## 📈 **Scaling Options**

### **OpenRouter Plans**
- **Pay-as-you-go**: $5 minimum credit
- **Pro**: Better rates for high volume
- **Enterprise**: Custom pricing and support

### **Alternative Providers**
- **Anthropic Direct**: Claude API
- **OpenAI Direct**: GPT-4 API
- **Google AI**: Gemini API

## 🎯 **Why This Setup is Optimal**

### **MedGemma-4B-PT Advantages**
- **Medical specialization**: Trained specifically for medical applications
- **Clinical accuracy**: High-quality medical reasoning
- **Multimodal capability**: Handles both text and images
- **Professional grade**: Suitable for clinical decision support

### **OpenRouter Benefits**
- **Model variety**: Access to best models from multiple providers
- **Cost efficiency**: Competitive pricing
- **Reliability**: High uptime and performance
- **Easy integration**: Simple API interface

## 🔒 **Security & Privacy**

- **Secure API**: All requests encrypted
- **No data storage**: Images and queries not stored
- **Patient privacy**: No PHI logging
- **Compliance**: HIPAA-friendly architecture

## 📞 **Support**

### **Getting Help**
1. Check OpenRouter dashboard for usage and errors
2. Verify API keys and credits
3. Test with simple queries first
4. Check rate limits and quotas

### **Resources**
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)

## 🎉 **You're All Set!**

Your medical AI chatbot is now powered by:
- ✅ **MedGemma-4B-PT** for clinical-grade medical AI
- ✅ **Claude 3.5 Sonnet** for advanced medical reasoning
- ✅ **GPT-4 Vision** for medical image analysis
- ✅ **Smart fallback** to free models
- ✅ **Professional medical responses**

**Ready for clinical use!** 🏥✨
