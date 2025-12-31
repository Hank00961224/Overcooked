import { OptimizedImageService } from './optimizedImageService';

const imageService = new OptimizedImageService();

async function generateOutfit(params: any) {
  const personResult = await imageService.fetchImage({
    gender: params.gender,
    style: params.style,
    occasion: params.occasion,
    weather: params.weather,
    category: 'person',
    query: `${params.gender} person ${params.style}`
  });

  const topResult = await imageService.fetchImage({
    style: params.style,
    occasion: params.occasion,
    weather: params.weather,
    category: 'top',
    query: `${params.style} shirt ${params.weather}`
  });

  // Show quota warning if needed
  if (personResult.quotaWarning) {
    showNotification('使用預設圖片以避免超額，快取將於1小時後重置');
  }

  // Display remaining quota
  const remaining = imageService.getRemainingQuota();
  console.log(`剩餘配額: ${remaining} 次請求`);
}
