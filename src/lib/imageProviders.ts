// Список провайдеров для генерации изображений
export interface ImageProvider {
  id: string;
  name: string;
  url: (prompt: string, width: number, height: number, seed: number) => string;
  timeout: number;
  priority: number;
  requiresAuth: boolean;
}

export const imageProviders: ImageProvider[] = [
  // === PUTER.JS (Безлимитный, без API ключа) ===
  {
    id: 'puter',
    name: 'Puter.js (Flux)',
    url: (prompt, width, height, seed) =>
      `https://api.puter.com/v1/image/generate?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}`,
    timeout: 30000,
    priority: 1,
    requiresAuth: false,
  },
  
  // === RAPHAEL AI (Полностью бесплатный) ===
  {
    id: 'raphael',
    name: 'Raphael AI',
    url: (prompt, width, height, seed) =>
      `https://api.raphael.app/v1/generate?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}`,
    timeout: 35000,
    priority: 2,
    requiresAuth: false,
  },
  
  // === IMAGEROUTER.IO (130+ моделей) ===
  {
    id: 'imagerouter',
    name: 'Imagerouter.io',
    url: (prompt, width, height, seed) =>
      `https://api.imagerouter.io/v1/generate?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}&model=flux`,
    timeout: 35000,
    priority: 3,
    requiresAuth: false,
  },
  
  // === HUGGING FACE (Stable Diffusion) ===
  {
    id: 'huggingface',
    name: 'Hugging Face (SDXL)',
    url: (prompt, width, height, seed) =>
      `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0?inputs=${encodeURIComponent(prompt)}`,
    timeout: 40000,
    priority: 4,
    requiresAuth: false,
  },
  
  // === PRODIA (Бесплатный тариф) ===
  {
    id: 'prodia',
    name: 'Prodia',
    url: (prompt, width, height, seed) =>
      `https://api.prodia.com/v1/generate?prompt=${encodeURIComponent(prompt)}&width=${width}&height=${height}&seed=${seed}`,
    timeout: 35000,
    priority: 5,
    requiresAuth: false,
  },
  
  // === POLLINATIONS (Резервный) ===
  {
    id: 'pollinations-main',
    name: 'Pollinations.ai (Main)',
    url: (prompt, width, height, seed) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
    timeout: 30000,
    priority: 6,
    requiresAuth: false,
  },
];

// Сортируем по приоритету
export const sortedProviders = [...imageProviders].sort((a, b) => a.priority - b.priority);

// Функция для проверки доступности изображения
export function testImageUrl(url: string, timeout: number, providerId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timer = setTimeout(() => {
      img.src = '';
      console.warn(`Timeout: ${providerId}`);
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      console.log(`Success: ${providerId}`);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      console.warn(`Failed: ${providerId}`);
      resolve(false);
    };
    
    img.src = url;
  });
}

// Генерация с авто-переключением провайдеров
export async function generateWithFallback(
  prompt: string,
  width: number = 1024,
  height: number = 1024
): Promise<{ url: string; provider: string } | null> {
  const seed = Math.floor(Math.random() * 10000);
  
  console.log(`Starting generation with ${sortedProviders.length} providers`);
  
  for (const provider of sortedProviders) {
    try {
      const url = provider.url(prompt, width, height, seed);
      console.log(`Trying provider: ${provider.name}`);
      
      const success = await testImageUrl(url, provider.timeout, provider.id);
      
      if (success) {
        console.log(`✅ Success with: ${provider.name}`);
        return { url, provider: provider.name };
      }
    } catch (error) {
      console.warn(`Error with ${provider.name}:`, error);
      continue;
    }
  }
  
  console.error('❌ All providers failed');
  return null;
}
