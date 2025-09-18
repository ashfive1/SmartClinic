# Free Medical AI Setup Guide

This guide shows you how to set up a **completely free** medical AI chatbot using the best available free models.

## 🎯 **What You Get**

### **Text Queries**
- **Llama 3.1 8B** via Groq (FREE)
- Excellent medical knowledge and reasoning
- Clinical decision support
- Patient context integration

### **Image Analysis**
- **BLIP** image captioning via Hugging Face (FREE)
- **Llama 3.1 8B** for medical interpretation (FREE)
- Medical image analysis (X-rays, CT scans, etc.)

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Get Free API Keys**

#### **Groq API Key (for Llama 3.1 8B)**
1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for free account
3. Get your API key
4. **Free tier**: 14,400 requests/day

#### **Hugging Face API Key (for image analysis)**
1. Go to [Hugging Face](https://huggingface.co/settings/tokens)
2. Sign up for free account
3. Create new token with "Read" permissions
4. **Free tier**: 1,000 requests/month

### **Step 2: Configure Environment**

Create/update your `.env.local` file:

```bash
# Free Medical AI Configuration
GROQ_API_KEY=your_groq_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: Model configuration
GROQ_MODEL=llama-3.1-8b-instant

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **Step 3: Start Your App**

```bash
npm run dev
```

## 💰 **Cost Breakdown**

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Groq (Llama 3.1 8B)** | 14,400 requests/day | $0 |
| **Hugging Face (BLIP)** | 1,000 requests/month | $0 |
| **Total Monthly Cost** | - | **$0** |

## 🏥 **Medical AI Capabilities**

### **Text Queries**
- Symptom analysis
- Differential diagnosis suggestions
- Clinical reasoning
- Treatment recommendations
- Medical explanations
- Patient context integration

### **Image Analysis**
- Medical image description
- Clinical insights from images
- X-ray, CT, MRI analysis
- Dermatology image analysis
- Combined text + image queries

## 🔧 **Advanced Configuration**

### **Model Options**
```bash
# Available Groq models (all free)
GROQ_MODEL=llama-3.1-8b-instant        # Fastest
GROQ_MODEL=llama-3.1-70b-versatile     # Most capable
GROQ_MODEL=mixtral-8x7b-32768          # Good balance
```

### **Performance Tuning**
```bash
# In your API calls, you can adjust:
temperature: 0.1        # Lower = more consistent
max_tokens: 1000        # Response length
```

## 📊 **Usage Monitoring**

The system includes built-in usage tracking:

```json
{
  "model": "Llama 3.1 8B (Free via Groq)",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 200,
    "total_tokens": 350
  }
}
```

## 🚨 **Rate Limits & Best Practices**

### **Groq Limits**
- **Free tier**: 14,400 requests/day
- **Rate limit**: 30 requests/minute
- **Best practice**: Batch requests when possible

### **Hugging Face Limits**
- **Free tier**: 1,000 requests/month
- **Rate limit**: 1 request/second
- **Best practice**: Cache image analysis results

## 🔄 **Fallback System**

The system includes smart fallbacks:

1. **Primary**: Llama 3.1 8B + BLIP (best quality)
2. **Fallback**: Demo responses (if APIs unavailable)
3. **Error handling**: Clear error messages with setup instructions

## 🛠️ **Troubleshooting**

### **"GROQ_API_KEY is required" Error**
- Check your `.env.local` file
- Verify the API key is correct
- Restart your development server

### **Rate Limit Exceeded**
- Wait a few minutes before retrying
- Consider upgrading to paid tier if needed
- Implement request queuing

### **Image Analysis Not Working**
- Check HUGGINGFACE_API_KEY
- Verify image file size (< 10MB)
- Ensure image format is supported

## 📈 **Scaling Options**

### **If You Need More Requests**

#### **Groq Paid Plans**
- **Pro**: $9/month for 60,000 requests/day
- **Enterprise**: Custom pricing

#### **Hugging Face Paid Plans**
- **Pro**: $9/month for 10,000 requests/month
- **Enterprise**: Custom pricing

### **Alternative Free Options**
- **Ollama**: Run models locally (requires powerful hardware)
- **Google Colab**: Free GPU access for model inference
- **Replicate**: Free tier with model hosting

## 🎯 **Why This Setup is Optimal**

### **Llama 3.1 8B Advantages**
- **Medical knowledge**: Trained on medical literature
- **Fast inference**: Optimized for speed
- **Free access**: No cost via Groq
- **High quality**: Comparable to paid models

### **BLIP for Images**
- **Medical image understanding**: Good for clinical images
- **Free access**: Via Hugging Face
- **Reliable**: Stable and well-tested

## 🔒 **Security & Privacy**

- **No data storage**: Images and queries are not stored
- **API-only**: All processing happens via secure APIs
- **Patient privacy**: No PHI is logged or retained
- **Local processing**: Your data stays on your system

## 📞 **Support**

### **Getting Help**
1. Check the console logs for error messages
2. Verify API keys are correctly configured
3. Test with simple queries first
4. Check rate limits and quotas

### **Community Resources**
- [Groq Documentation](https://console.groq.com/docs)
- [Hugging Face Docs](https://huggingface.co/docs)
- [Llama 3.1 Model Card](https://huggingface.co/meta-llama/Llama-3.1-8B)

## 🎉 **You're All Set!**

Your medical AI chatbot is now running with:
- ✅ **Free Llama 3.1 8B** for medical text analysis
- ✅ **Free BLIP** for medical image analysis
- ✅ **Patient context integration**
- ✅ **Clinical disclaimers and safety**
- ✅ **Professional medical responses**

**Total cost: $0/month** 🎯
