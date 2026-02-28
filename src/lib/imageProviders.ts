// Список провайдеров для генерации изображений
export interface ImageProvider {
  id: string;
  name: string;
  url: (prompt: string, width: number, height: number, seed: number) => string;
  timeout: number;
  priority: number; // Меньше = выше приоритет
}

export const imageProviders: ImageProvider[] = [
  {
    id: 'pollinations-main',
    name: 'Pollinations.ai (Main)',
    url: (prompt, width, height, seed) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
    timeout: 30000,
    priority: 1,
  },
  {
    id: 'pollinations-flux',
    name: 'Pollinations.ai (Flux)',
    url: (prompt, width, height, seed) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`,
    timeout: 35000,
    priority: 2,
  },
  {
    id: 'pollinations-p',
    name: 'Pollinations.ai (P)',
    url: (prompt, width, height, seed) =>
      `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}`,
    timeout: 30000,
    priority: 3,
  },
  {
    id: 'pollinations-backup',
    name: 'Pollinations.ai (Backup)',
    url: (prompt, width, height, seed) =>
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&private=true`,
    timeout: 35000,
    priority: 4,
  },
];

// Сортируем по приоритету
export const sortedProviders = [...imageProviders].sort((a, b) => a.priority - b.priority);

// Функция для проверки доступности изображения
export function testImageUrl(url: string, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const timer = setTimeout(() => {
      img.src = '';
      resolve(false);
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
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
  
  for (const provider of sortedProviders) {
    const url = provider.url(prompt, width, height, seed);
    
    console.log(`Trying provider: ${provider.name}`);
    
    const success = await testImageUrl(url, provider.timeout);
    
    if (success) {
      console.log(`Success with: ${provider.name}`);
      return { url, provider: provider.name };
    }
    
    console.warn(`Failed: ${provider.name}`);
  }
  
  return null;
}
